import { z } from "zod";
import { HARI_PEKAN, JAM_REGEX } from "./time";

/**
 * Skema validasi (zod) untuk semua data yang disimpan maupun yang dikirim
 * lewat form admin. Data dari Redis juga divalidasi ulang saat dibaca.
 */

export const MAKS_JADWAL = 100;
export const MAKS_GALERI = 60;
export const MAKS_PENETAPAN = 30;

// Karakter kontrol (termasuk baris baru) tidak diizinkan di field satu baris.
const KARAKTER_KONTROL = /[\u0000-\u001F\u007F]/;

function teks(label: string, { min = 0, max }: { min?: number; max: number }) {
  return z
    .string({ error: `${label} wajib diisi` })
    .trim()
    .min(min, min <= 1 ? `${label} wajib diisi` : `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`)
    .refine((v) => !KARAKTER_KONTROL.test(v), `${label} mengandung karakter yang tidak diizinkan`);
}

const tanggal = z.iso.date({ error: "Tanggal tidak valid" });
const jam = z.string({ error: "Jam wajib diisi" }).regex(JAM_REGEX, "Jam tidak valid (format JJ:MM)");
const hari = z.enum(HARI_PEKAN, { error: "Pilih hari yang valid" });
const id = z.uuid();
const contoh = z.boolean().optional();

/* ------------------------------ Jadwal ------------------------------ */

export const khotibInput = z.object({
  tanggal,
  khotib: teks("Nama khotib", { min: 3, max: 100 }),
  imam: teks("Nama imam", { max: 100 }),
  tema: teks("Tema khutbah", { max: 150 }),
});

export const pengajianRabuInput = z.object({
  tanggal,
  jam,
  ustadz: teks("Nama ustadz", { min: 3, max: 100 }),
  materi: teks("Materi", { min: 3, max: 150 }),
});

export const kuliahSubuhInput = z.object({
  hari,
  ustadz: teks("Nama ustadz", { min: 3, max: 100 }),
  materi: teks("Materi", { min: 3, max: 150 }),
});

export const pengajianIbuInput = z.object({
  hari,
  jam,
  ustadzah: teks("Nama ustadzah", { min: 3, max: 100 }),
  materi: teks("Materi", { min: 3, max: 150 }),
});

export const khotibItem = khotibInput.extend({ id, contoh });
export const pengajianRabuItem = pengajianRabuInput.extend({ id, contoh });
export const kuliahSubuhItem = kuliahSubuhInput.extend({ id, contoh });
export const pengajianIbuItem = pengajianIbuInput.extend({ id, contoh });

export type KhotibItem = z.infer<typeof khotibItem>;
export type PengajianRabuItem = z.infer<typeof pengajianRabuItem>;
export type KuliahSubuhItem = z.infer<typeof kuliahSubuhItem>;
export type PengajianIbuItem = z.infer<typeof pengajianIbuItem>;

export const JENIS_JADWAL = ["khotib", "pengajianRabu", "kuliahSubuh", "pengajianIbu"] as const;
export type JenisJadwal = (typeof JENIS_JADWAL)[number];

export const inputJadwal = {
  khotib: khotibInput,
  pengajianRabu: pengajianRabuInput,
  kuliahSubuh: kuliahSubuhInput,
  pengajianIbu: pengajianIbuInput,
} as const;

/* ---------------------------- Hitung mundur ---------------------------- */

export const KUNCI_ACARA = ["ramadhan", "syawwal", "idul-adha"] as const;
export type KunciAcara = (typeof KUNCI_ACARA)[number];

export const penetapanSchema = z.object({
  acara: z.enum(KUNCI_ACARA, { error: "Pilih acara yang valid" }),
  tahunHijriah: z.int().min(1440).max(1600),
  tanggal,
  catatan: teks("Catatan", { max: 150 }),
});

export const countdownSchema = z.object({
  koreksiHijriah: z.int().min(-2).max(2),
  penetapan: z.array(penetapanSchema).max(MAKS_PENETAPAN),
});

export type Penetapan = z.infer<typeof penetapanSchema>;
export type CountdownSetting = z.infer<typeof countdownSchema>;

/* ------------------------------- Kontak ------------------------------- */

export const kontakSchema = z.object({
  telepon: z
    .string()
    .trim()
    .max(20, "Nomor telepon terlalu panjang")
    .regex(/^$|^[0-9+()\- ]{6,20}$/, "Nomor telepon hanya boleh berisi angka, spasi, +, -, ( )"),
  whatsapp: z
    .string()
    .trim()
    .max(20, "Nomor WhatsApp terlalu panjang")
    .regex(/^$|^[0-9+\- ]{8,20}$/, "Nomor WhatsApp hanya boleh berisi angka, spasi, +, -"),
  email: z.union([z.literal(""), z.email("Alamat email tidak valid").max(100)]),
  instagram: z
    .string()
    .trim()
    .max(31)
    .transform((v) => v.replace(/^@/, ""))
    .pipe(z.string().regex(/^$|^[A-Za-z0-9._]{1,30}$/, "Username Instagram tidak valid")),
});

export type Kontak = z.infer<typeof kontakSchema>;

/* -------------------------------- Foto -------------------------------- */

const POLA_URL_LOKAL = /^\/images\/[a-z0-9-]+\.svg$/;
const POLA_URL_BLOB =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/masjid\/(hero|legalitas|galeri)\/[0-9a-f-]{36}\.webp$/i;

export const fotoSchema = z.object({
  url: z
    .string()
    .max(300)
    .refine((u) => POLA_URL_LOKAL.test(u) || POLA_URL_BLOB.test(u), "URL foto tidak valid"),
  /** Pathname di Vercel Blob; null untuk gambar contoh bawaan. */
  pathname: z.string().max(200).nullable(),
  lebar: z.int().positive().max(10000),
  tinggi: z.int().positive().max(10000),
});

export type Foto = z.infer<typeof fotoSchema>;

export const heroSchema = fotoSchema.nullable();

/* ------------------------------ Legalitas ------------------------------ */

export const nomorRegistrasiSchema = z
  .string()
  .trim()
  .max(60, "Nomor registrasi maksimal 60 karakter")
  .regex(/^[A-Za-z0-9.\-/: ]*$/, "Nomor registrasi hanya boleh berisi huruf, angka, spasi, titik, strip, titik dua, atau garis miring");

const dokumenSchema = z.object({ nomor: nomorRegistrasiSchema, foto: fotoSchema.nullable() });

export const legalitasSchema = z.object({ kemenag: dokumenSchema, dmi: dokumenSchema });
export type Legalitas = z.infer<typeof legalitasSchema>;
export const JENIS_LEGALITAS = ["kemenag", "dmi"] as const;
export type JenisLegalitas = (typeof JENIS_LEGALITAS)[number];

/* ------------------------------- Galeri ------------------------------- */

export const keteranganGaleriSchema = teks("Keterangan", { min: 3, max: 200 });
export const tanggalGaleriSchema = z.union([z.literal(""), tanggal]);

export const galeriItem = z.object({
  id,
  foto: fotoSchema,
  keterangan: keteranganGaleriSchema,
  tanggal: tanggalGaleriSchema,
  contoh,
});

export type GaleriItem = z.infer<typeof galeriItem>;

/* --------------------------- Kumpulan konten --------------------------- */

export const skemaKonten = {
  khotib: z.array(khotibItem).max(MAKS_JADWAL),
  pengajianRabu: z.array(pengajianRabuItem).max(MAKS_JADWAL),
  kuliahSubuh: z.array(kuliahSubuhItem).max(MAKS_JADWAL),
  pengajianIbu: z.array(pengajianIbuItem).max(MAKS_JADWAL),
  countdown: countdownSchema,
  kontak: kontakSchema,
  legalitas: legalitasSchema,
  hero: heroSchema,
  galeri: z.array(galeriItem).max(MAKS_GALERI),
} as const;

export type KunciKonten = keyof typeof skemaKonten;
export type Konten = { [K in KunciKonten]: z.output<(typeof skemaKonten)[K]> };
