import "server-only";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import sharp, { type OutputInfo } from "sharp";
import type { Foto } from "@/lib/schemas";

/**
 * Validasi & penyimpanan foto upload admin:
 * 1. maksimal 5 MB,
 * 2. tipe asli dicek dari magic bytes (JPG/PNG/WEBP), bukan dari nama/MIME,
 * 3. gambar di-decode ulang dengan sharp (file rusak/polyglot ditolak),
 *    diputar sesuai EXIF, diperkecil maks 2000 px, metadata (termasuk lokasi
 *    GPS) dibuang, lalu disimpan sebagai WEBP,
 * 4. nama file diganti UUID acak sebelum disimpan di Vercel Blob.
 */

export const UKURAN_MAKS_FOTO = 5 * 1024 * 1024;
const SISI_MAKS = 2000;

sharp.cache(false);

export class FotoTidakValid extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "FotoTidakValid";
  }
}

type TipeGambar = "jpeg" | "png" | "webp";

export function deteksiTipeGambar(b: Uint8Array): TipeGambar | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((x, i) => b[i] === x)) return "png";
  const ascii = (dari: number, sampai: number) => String.fromCharCode(...b.subarray(dari, sampai));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function blobTerkonfigurasi(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function prosesDanUnggahFoto(
  file: FormDataEntryValue | null,
  folder: "hero" | "legalitas" | "galeri",
): Promise<Foto> {
  if (!(file instanceof File) || file.size === 0) {
    throw new FotoTidakValid("Pilih file foto terlebih dahulu.");
  }
  if (file.size > UKURAN_MAKS_FOTO) {
    throw new FotoTidakValid("Ukuran foto maksimal 5 MB.");
  }
  const masukan = new Uint8Array(await file.arrayBuffer());
  const tipe = deteksiTipeGambar(masukan);
  if (!tipe) {
    throw new FotoTidakValid("File harus berupa foto JPG, PNG, atau WEBP.");
  }

  let hasil: { data: Buffer; info: OutputInfo };
  try {
    const gambar = sharp(masukan, { limitInputPixels: 50_000_000, failOn: "error" });
    const meta = await gambar.metadata();
    if (meta.format !== tipe) throw new Error(`format ${meta.format} tidak sesuai magic bytes ${tipe}`);
    hasil = await gambar
      .rotate()
      .resize({ width: SISI_MAKS, height: SISI_MAKS, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    console.warn("[unggah-foto] Gambar ditolak:", (err as Error).message);
    throw new FotoTidakValid("File foto rusak atau tidak dapat dibaca. Coba foto lain.");
  }

  if (!blobTerkonfigurasi()) {
    throw new FotoTidakValid(
      "Penyimpanan foto (Vercel Blob) belum dikonfigurasi. Hubungkan Blob store ke proyek Vercel.",
    );
  }

  const blob = await put(`masjid/${folder}/${randomUUID()}.webp`, hasil.data, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    lebar: hasil.info.width,
    tinggi: hasil.info.height,
  };
}

/** Menghapus foto lama dari Blob. Gambar contoh bawaan (pathname null) dilewati. */
export async function hapusFoto(foto: Foto | null | undefined): Promise<void> {
  if (!foto?.pathname) return;
  try {
    await del(foto.url);
  } catch (err) {
    console.warn("[unggah-foto] Gagal menghapus foto lama:", (err as Error).message);
  }
}
