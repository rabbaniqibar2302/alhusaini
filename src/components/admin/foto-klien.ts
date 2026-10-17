/**
 * Persiapan foto di browser sebelum dikirim ke server action. Validasi utama
 * (magic bytes, decode ulang, ukuran) tetap dilakukan di server; di sini hanya
 * pemeriksaan awal dan memperkecil foto besar, karena batas body request
 * fungsi Vercel adalah 4,5 MB.
 */

export const UKURAN_MAKS = 5 * 1024 * 1024;
const BATAS_KIRIM = 4 * 1024 * 1024;
export const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_FOTO = TIPE_DIIZINKAN.join(",");

export const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

async function perkecilFoto(file: File): Promise<File> {
  const gambar = await createImageBitmap(file);
  const skala = Math.min(1, 2560 / Math.max(gambar.width, gambar.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(gambar.width * skala);
  kanvas.height = Math.round(gambar.height * skala);
  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, kanvas.width, kanvas.height);
  ctx.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
  gambar.close();
  for (const kualitas of [0.88, 0.8, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/jpeg", kualitas));
    if (blob && blob.size <= BATAS_KIRIM) {
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
    }
  }
  throw new Error("Foto masih terlalu besar");
}

export type HasilSiapkan = { file: File; info?: string } | { galat: string };

/** Cek tipe & ukuran, lalu perkecil foto di atas 4 MB. */
export async function siapkanFoto(file: File): Promise<HasilSiapkan> {
  if (!TIPE_DIIZINKAN.includes(file.type)) return { galat: "File harus berupa foto JPG, PNG, atau WEBP." };
  if (file.size > UKURAN_MAKS) return { galat: `Ukuran foto ${mb(file.size)} melebihi batas 5 MB.` };
  if (file.size <= BATAS_KIRIM) return { file };
  try {
    const kecil = await perkecilFoto(file);
    return { file: kecil, info: `Foto diperkecil otomatis dari ${mb(file.size)} menjadi ${mb(kecil.size)}.` };
  } catch {
    return { galat: "Foto gagal diperkecil di perangkat ini. Gunakan foto berukuran di bawah 4 MB." };
  }
}
