import "server-only";
import { del } from "@vercel/blob";
import { UKURAN_MAKS_AUDIO, deteksiFormatAudio, type FormatAudio } from "@/lib/audio";
import type { AudioAdzan } from "@/lib/schemas";

/**
 * Suara adzan diunggah langsung dari browser ke Vercel Blob (file bisa lebih
 * besar dari batas request fungsi Vercel 4,5 MB). Token unggah hanya
 * diberikan kepada admin yang login (lihat app/admin/unggah-audio), dan
 * setelah terunggah file diperiksa lagi di sini sebelum dipakai.
 */

export class AudioTidakValid extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "AudioTidakValid";
  }
}

/** Host publik store Blob milik proyek ini, dari BLOB_READ_WRITE_TOKEN (`vercel_blob_rw_<storeId>_...`). */
export function hostBlobSendiri(): string | null {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

async function bacaAwal(res: Response, jumlah: number): Promise<Uint8Array> {
  const pembaca = res.body?.getReader();
  const potongan: Uint8Array[] = [];
  let total = 0;
  while (pembaca && total < jumlah) {
    const { done, value } = await pembaca.read();
    if (done) break;
    potongan.push(value);
    total += value.length;
  }
  await pembaca?.cancel().catch(() => {});
  const hasil = new Uint8Array(Math.min(total, jumlah));
  let posisi = 0;
  for (const p of potongan) {
    const bagian = p.subarray(0, hasil.length - posisi);
    hasil.set(bagian, posisi);
    posisi += bagian.length;
    if (posisi >= hasil.length) break;
  }
  return hasil;
}

/**
 * Memastikan file yang baru diunggah benar-benar milik store ini, berupa
 * audio sesuai ekstensinya (dicek dari magic bytes), dan tidak melebihi batas.
 */
export async function periksaAudioTerunggah(url: string): Promise<{ format: FormatAudio; ukuran: number }> {
  const host = hostBlobSendiri();
  const alamat = new URL(url);
  if (!host || alamat.hostname !== host) throw new AudioTidakValid("Alamat file audio tidak dikenal.");

  let res: Response;
  try {
    res = await fetch(alamat, {
      headers: { range: "bytes=0-63" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AudioTidakValid("File audio belum dapat diperiksa. Silakan coba lagi.");
  }
  if (res.status !== 200 && res.status !== 206) {
    await res.body?.cancel().catch(() => {});
    throw new AudioTidakValid("File audio tidak ditemukan. Silakan unggah ulang.");
  }
  const ukuran = Number(
    res.status === 206 ? res.headers.get("content-range")?.split("/")[1] : res.headers.get("content-length"),
  );
  const format = deteksiFormatAudio(await bacaAwal(res, 64));
  if (!format || alamat.pathname.split(".").pop() !== format) {
    throw new AudioTidakValid("File harus berupa audio MP3, M4A, atau OGG.");
  }
  if (!Number.isFinite(ukuran) || ukuran <= 0 || ukuran > UKURAN_MAKS_AUDIO) {
    throw new AudioTidakValid("Ukuran file audio maksimal 15 MB.");
  }
  return { format, ukuran };
}

export async function hapusAudio(audio: Pick<AudioAdzan, "url"> | null | undefined): Promise<void> {
  if (!audio) return;
  try {
    await del(audio.url);
  } catch (err) {
    console.warn("[audio-adzan] Gagal menghapus file lama:", (err as Error).message);
  }
}
