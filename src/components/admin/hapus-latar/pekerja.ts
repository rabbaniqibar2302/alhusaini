/// <reference lib="webworker" />

/**
 * Web Worker penghapus latar belakang foto penceramah. Berjalan di browser
 * admin (gratis, foto tidak dikirim ke layanan lain) memakai model MODNet
 * (portrait matting, lisensi Apache-2.0) di ONNX Runtime Web (MIT). Runtime &
 * model disajikan dari /public/hapus-latar dan hanya diunduh saat dipakai.
 */

import type { PesanKeInduk, PesanKePekerja } from "./tipe";

declare const self: DedicatedWorkerGlobalScope;

const DASAR = "/hapus-latar/";
const URL_ORT = `${DASAR}ort.wasm.bundle.min.mjs`;
const URL_WASM = `${DASAR}ort-wasm-simd-threaded.wasm`;
const URL_MODEL = `${DASAR}modnet.onnx`;
// Perkiraan ukuran bila server tidak mengirim Content-Length (mis. dikompresi).
const PERKIRAAN_BYTE = { wasm: 14_239_897, model: 25_888_640 };

/** Hasil foto: sisi terpanjang maksimal (server juga membatasi 1200 px). */
const SISI_HASIL = 1600;
const BATAS_KIRIM = 4 * 1024 * 1024;

type TensorOrt = { data: Float32Array; dims: readonly number[] };
type SesiOrt = { run(masukan: Record<string, TensorOrt>): Promise<Record<string, TensorOrt>>; inputNames: readonly string[]; outputNames: readonly string[] };
type Ort = {
  env: { wasm: { wasmBinary?: ArrayBuffer | Uint8Array; numThreads?: number; proxy?: boolean } };
  InferenceSession: { create(model: Uint8Array, opsi?: Record<string, unknown>): Promise<SesiOrt> };
  Tensor: new (tipe: "float32", data: Float32Array, dims: number[]) => TensorOrt;
};

function kirim(pesan: PesanKeInduk, transfer: Transferable[] = []) {
  self.postMessage(pesan, transfer);
}

async function unduh(url: string, perkiraan: number, onByte: (diterima: number, total: number) => void) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Gagal mengunduh ${url} (HTTP ${res.status})`);
  const total = Number(res.headers.get("content-length")) || perkiraan;
  const pembaca = res.body.getReader();
  const potongan: Uint8Array[] = [];
  let diterima = 0;
  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    potongan.push(value);
    diterima += value.length;
    onByte(diterima, Math.max(total, diterima));
  }
  const hasil = new Uint8Array(diterima);
  let posisi = 0;
  for (const p of potongan) {
    hasil.set(p, posisi);
    posisi += p.length;
  }
  return hasil;
}

let siap: Promise<{ ort: Ort; sesi: SesiOrt }> | null = null;

function muatModel(id: number) {
  siap ??= (async () => {
    const kemajuan = { wasm: [0, PERKIRAAN_BYTE.wasm], model: [0, PERKIRAAN_BYTE.model] };
    const lapor = () =>
      kirim({
        id,
        jenis: "unduh",
        diterima: kemajuan.wasm[0] + kemajuan.model[0],
        total: kemajuan.wasm[1] + kemajuan.model[1],
      });
    const [modul, wasm, model] = await Promise.all([
      import(/* turbopackIgnore: true */ /* webpackIgnore: true */ URL_ORT) as Promise<Ort>,
      unduh(URL_WASM, PERKIRAAN_BYTE.wasm, (d, t) => ((kemajuan.wasm = [d, t]), lapor())),
      unduh(URL_MODEL, PERKIRAAN_BYTE.model, (d, t) => ((kemajuan.model = [d, t]), lapor())),
    ]);
    modul.env.wasm.wasmBinary = wasm;
    modul.env.wasm.numThreads = 1;
    modul.env.wasm.proxy = false;
    const sesi = await modul.InferenceSession.create(model, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return { ort: modul, sesi };
  })();
  // Bila gagal (mis. koneksi putus), percobaan berikutnya mengunduh ulang.
  siap.catch(() => {
    siap = null;
  });
  return siap;
}

const kelipatan32 = (n: number) => Math.max(32, Math.round(n / 32) * 32);

function kanvas(lebar: number, tinggi: number) {
  const k = new OffscreenCanvas(lebar, tinggi);
  const ctx = k.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { k, ctx };
}

async function keBlob(k: OffscreenCanvas): Promise<Blob> {
  // WEBP lebih kecil; Safari lama hanya bisa PNG.
  const webp = await k.convertToBlob({ type: "image/webp", quality: 0.92 });
  return webp.type === "image/webp" ? webp : k.convertToBlob({ type: "image/png" });
}

/**
 * Penanda piksel yang dipertahankan: bagian matte yang tersambung dengan area
 * terbesar (tubuh orang), diperlebar sedikit supaya tepi rambut yang tipis
 * tidak ikut terbuang. Bercak lain (sisa latar) ditandai 0.
 */
function areaUtama(matte: ArrayLike<number>, w: number, h: number): Uint8Array {
  const luas = w * h;
  const label = new Int32Array(luas);
  const tumpukan = new Int32Array(luas);
  const ukuran: number[] = [0];
  for (let mulai = 0; mulai < luas; mulai++) {
    if (label[mulai] !== 0 || matte[mulai] < 0.5) continue;
    const nomor = ukuran.length;
    let n = 0;
    let atas = 0;
    tumpukan[atas++] = mulai;
    label[mulai] = nomor;
    while (atas > 0) {
      const i = tumpukan[--atas];
      n++;
      const x = i % w;
      const tetangga = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of tetangga) {
        if (j >= 0 && j < luas && label[j] === 0 && matte[j] >= 0.5) {
          label[j] = nomor;
          tumpukan[atas++] = j;
        }
      }
    }
    ukuran.push(n);
  }
  const terbesar = Math.max(...ukuran);
  const hasil = new Uint8Array(luas);
  if (terbesar === 0) return hasil;
  // Bagian lain yang cukup besar (mis. tangan terpisah) tetap dipertahankan.
  const dipakai = ukuran.map((n) => n >= terbesar * 0.15);
  for (let i = 0; i < luas; i++) if (label[i] > 0 && dipakai[label[i]]) hasil[i] = 1;

  // Perlebar 4 px (max filter terpisah horizontal lalu vertikal).
  const r = 4;
  const sementara = new Uint8Array(luas);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let d = Math.max(0, x - r); d <= Math.min(w - 1, x + r) && !v; d++) v = hasil[y * w + d];
      sementara[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let d = Math.max(0, y - r); d <= Math.min(h - 1, y + r) && !v; d++) v = sementara[d * w + x];
      hasil[y * w + x] = v;
    }
  }
  return hasil;
}

async function proses(id: number, file: Blob) {
  const { ort, sesi } = await muatModel(id);
  kirim({ id, jenis: "proses" });

  const gambar = await createImageBitmap(file);
  const L = gambar.width;
  const T = gambar.height;

  // Masukan model: sisi terpendek 512 px, kelipatan 32 (sesuai pelatihan MODNet).
  let s = 512 / Math.min(L, T);
  if (Math.max(L, T) * s > 1024) s = 1024 / Math.max(L, T);
  const w = kelipatan32(L * s);
  const h = kelipatan32(T * s);
  const masuk = kanvas(w, h);
  masuk.ctx.drawImage(gambar, 0, 0, w, h);
  const rgba = masuk.ctx.getImageData(0, 0, w, h).data;
  const luas = w * h;
  const tensor = new Float32Array(3 * luas);
  for (let i = 0; i < luas; i++) {
    tensor[i] = rgba[i * 4] / 127.5 - 1;
    tensor[luas + i] = rgba[i * 4 + 1] / 127.5 - 1;
    tensor[2 * luas + i] = rgba[i * 4 + 2] / 127.5 - 1;
  }
  const keluaran = await sesi.run({ [sesi.inputNames[0]]: new ort.Tensor("float32", tensor, [1, 3, h, w]) });
  const matte = keluaran[sesi.outputNames[0]].data;

  // Matte → kanal alfa. Nilai sangat kecil/besar dibulatkan supaya tidak ada bayangan tipis,
  // dan bercak latar yang terpisah dari tubuh dibuang.
  const pertahankan = areaUtama(matte, w, h);
  const masker = kanvas(w, h);
  const dataMasker = masker.ctx.createImageData(w, h);
  for (let i = 0; i < luas; i++) {
    const a = pertahankan[i] ? matte[i] : 0;
    dataMasker.data[i * 4 + 3] = a < 0.04 ? 0 : a > 0.97 ? 255 : Math.round(a * 255);
  }
  masker.ctx.putImageData(dataMasker, 0, 0);

  const skala = Math.min(1, SISI_HASIL / Math.max(L, T));
  const L1 = Math.round(L * skala);
  const T1 = Math.round(T * skala);
  const hasil = kanvas(L1, T1);
  hasil.ctx.drawImage(gambar, 0, 0, L1, T1);
  gambar.close();
  hasil.ctx.globalCompositeOperation = "destination-in";
  hasil.ctx.drawImage(masker.k, 0, 0, L1, T1);

  // Potong ke area orangnya saja (dengan sedikit ruang) supaya kartu rapi.
  const alfa = hasil.ctx.getImageData(0, 0, L1, T1).data;
  let x0 = L1, y0 = T1, x1 = -1, y1 = -1, isi = 0;
  for (let y = 0; y < T1; y++) {
    for (let x = 0; x < L1; x++) {
      if (alfa[(y * L1 + x) * 4 + 3] > 24) {
        isi++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0 || isi < L1 * T1 * 0.02) {
    throw new Error("Tidak ada orang yang terdeteksi di foto ini.");
  }
  const ruang = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  x0 = Math.max(0, x0 - ruang);
  y0 = Math.max(0, y0 - ruang);
  x1 = Math.min(L1 - 1, x1 + ruang);
  // Bagian bawah tidak diberi ruang: badan biasanya terpotong di tepi bawah foto.
  y1 = Math.min(T1 - 1, y1 + (y1 >= T1 - 2 ? 0 : ruang));

  let lebar = x1 - x0 + 1;
  let tinggi = y1 - y0 + 1;
  let blob: Blob | null = null;
  for (const faktor of [1, 0.8, 0.64, 0.5]) {
    const lb = Math.round(lebar * faktor);
    const tg = Math.round(tinggi * faktor);
    const akhir = kanvas(lb, tg);
    akhir.ctx.drawImage(hasil.k, x0, y0, lebar, tinggi, 0, 0, lb, tg);
    blob = await keBlob(akhir.k);
    if (blob.size <= BATAS_KIRIM) {
      lebar = lb;
      tinggi = tg;
      break;
    }
    blob = null;
  }
  if (!blob) throw new Error("Hasil foto terlalu besar.");
  kirim({ id, jenis: "selesai", blob, lebar, tinggi });
}

self.onmessage = (e: MessageEvent<PesanKePekerja>) => {
  const { id, file } = e.data;
  proses(id, file).catch((err: unknown) => {
    console.error("[hapus-latar]", err);
    kirim({ id, jenis: "galat", pesan: err instanceof Error ? err.message : String(err) });
  });
};
