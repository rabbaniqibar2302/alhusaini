import type { PesanKeInduk } from "./tipe";

export type StatusHapusLatar = { tahap: "unduh"; persen: number; mb: number } | { tahap: "proses" };

export type HasilHapusLatar = { file: File; lebar: number; tinggi: number };

let pekerja: Worker | null = null;
let nomor = 0;

function ambilPekerja(): Worker {
  pekerja ??= new Worker(new URL("./pekerja.ts", import.meta.url), { type: "module", name: "hapus-latar" });
  return pekerja;
}

export function hapusLatarDidukung(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof WebAssembly !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
}

/** Menghapus latar belakang foto orang di browser; hasilnya WEBP/PNG transparan yang sudah dipotong rapi. */
export function hapusLatar(file: File, onStatus: (s: StatusHapusLatar) => void): Promise<HasilHapusLatar> {
  const id = ++nomor;
  const w = ambilPekerja();
  return new Promise((selesai, gagal) => {
    const dengar = (e: MessageEvent<PesanKeInduk>) => {
      const p = e.data;
      if (p.id !== id) return;
      if (p.jenis === "unduh") {
        onStatus({ tahap: "unduh", persen: Math.min(100, Math.round((p.diterima / p.total) * 100)), mb: p.total / 1048576 });
        return;
      }
      if (p.jenis === "proses") {
        onStatus({ tahap: "proses" });
        return;
      }
      w.removeEventListener("message", dengar);
      w.removeEventListener("error", galat);
      if (p.jenis === "galat") {
        gagal(new Error(p.pesan));
        return;
      }
      const ext = p.blob.type === "image/webp" ? "webp" : "png";
      const nama = `${file.name.replace(/\.[^.]+$/, "") || "foto"}-tanpa-latar.${ext}`;
      selesai({ file: new File([p.blob], nama, { type: p.blob.type }), lebar: p.lebar, tinggi: p.tinggi });
    };
    const galat = (e: ErrorEvent) => {
      w.removeEventListener("message", dengar);
      w.removeEventListener("error", galat);
      // Pekerja rusak (mis. gagal dimuat); buat baru pada percobaan berikutnya.
      w.terminate();
      if (pekerja === w) pekerja = null;
      gagal(new Error(e.message || "Proses hapus latar gagal dimulai."));
    };
    w.addEventListener("message", dengar);
    w.addEventListener("error", galat);
    w.postMessage({ id, file });
  });
}
