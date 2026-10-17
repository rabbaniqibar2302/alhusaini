import { z } from "zod";
import {
  MAKS_FOTO_KEGIATAN,
  MAKS_FOTO_SEJARAH,
  MAKS_GALERI,
  MAKS_JADWAL,
  MAKS_KEGIATAN,
  MAKS_KETERANGAN_KEGIATAN,
  MAKS_NARASI,
  MAKS_PENETAPAN,
  MAKS_PENGUMUMAN,
} from "./batas";
import { POLA_PATHNAME_AUDIO, UKURAN_MAKS_AUDIO } from "./audio";
import { JENIS_KAJIAN, POLA_JADWAL } from "./kajian";
import { HARI_PEKAN, JAM_REGEX } from "./time";

/**
 * Skema validasi (zod) untuk semua data yang disimpan maupun yang dikirim
 * lewat form admin. Data dari Redis juga divalidasi ulang saat dibaca.
 */

export {
  MAKS_FOTO_KEGIATAN,
  MAKS_FOTO_SEJARAH,
  MAKS_GALERI,
  MAKS_JADWAL,
  MAKS_KEGIATAN,
  MAKS_KETERANGAN_KEGIATAN,
  MAKS_NARASI,
  MAKS_PENETAPAN,
  MAKS_PENGUMUMAN,
};

// Karakter kontrol (termasuk baris baru) tidak diizinkan di field satu baris.
const KARAKTER_KONTROL = /[\u0000-\u001F\u007F]/;
// Untuk teks panjang: baris baru boleh, karakter kontrol lain tidak.
const KONTROL_SELAIN_BARIS_BARU = /[\u0000-\u0009\u000B-\u001F\u007F]/;

function teks(label: string, { min = 0, max }: { min?: number; max: number }) {
  return z
    .string({ error: `${label} wajib diisi` })
    .trim()
    .min(min, min <= 1 ? `${label} wajib diisi` : `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`)
    .refine((v) => !KARAKTER_KONTROL.test(v), `${label} mengandung karakter yang tidak diizinkan`);
}

/** Teks beberapa paragraf. Ditampilkan dengan CSS `white-space: pre-line`, bukan sebagai HTML. */
function teksPanjang(label: string, { min = 0, max }: { min?: number; max: number }) {
  return z
    .string({ error: `${label} wajib diisi` })
    .transform((v) =>
      v
        .replace(/\r\n?/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[  ]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} wajib diisi` : `${label} minimal ${min} karakter`)
        .max(max, `${label} maksimal ${max.toLocaleString("id-ID")} karakter`)
        .refine((v) => !KONTROL_SELAIN_BARIS_BARU.test(v), `${label} mengandung karakter yang tidak diizinkan`),
    );
}

const tanggal = z.iso.date({ error: "Tanggal tidak valid" });
const jam = z.string({ error: "Jam wajib diisi" }).regex(JAM_REGEX, "Jam tidak valid (format JJ:MM)");
const hari = z.enum(HARI_PEKAN, { error: "Pilih hari yang valid" });
const id = z.uuid();
const contoh = z.boolean().optional();

const tanggalAtauKosong = z.union([z.literal(""), tanggal], { error: "Tanggal tidak valid" });
const hariAtauKosong = z.union([z.literal(""), hari], { error: "Pilih hari yang valid" });
const jamAtauKosong = z.union([z.literal(""), jam], { error: "Jam tidak valid (format JJ:MM)" });

/* ------------------------------ Khotib Jumat ------------------------------ */

export const khotibInput = z.object({
  tanggal,
  khotib: teks("Nama khotib", { min: 3, max: 100 }),
  imam: teks("Nama imam", { max: 100 }),
  tema: teks("Tema khutbah", { max: 150 }),
});

export const khotibItem = khotibInput.extend({ id, contoh });
export type KhotibItem = z.infer<typeof khotibItem>;

/* --------------------------------- Kajian --------------------------------- */

/**
 * Pengajian Rabu, Kuliah Subuh, dan Pengajian Kaum Ibu memakai bentuk yang
 * sama: tanggal tertentu ("tanggal") atau rutin setiap pekan ("mingguan").
 * Pengisinya bisa ustadz maupun ustadzah.
 */
const kajianDasar = z.object({
  pola: z.enum(POLA_JADWAL, { error: "Pilih jenis jadwal" }),
  tanggal: tanggalAtauKosong,
  hari: hariAtauKosong,
  jam: jamAtauKosong,
  ustadz: teks("Nama ustadz/ustadzah", { min: 3, max: 100 }),
  materi: teks("Materi", { min: 3, max: 150 }),
});

function kajianInput(aturanJam: "wajib" | "tanpa") {
  return kajianDasar
    .superRefine((x, ctx) => {
      if (x.pola === "tanggal" && !x.tanggal) {
        ctx.addIssue({ code: "custom", path: ["tanggal"], message: "Tanggal wajib diisi" });
      }
      if (x.pola === "mingguan" && !x.hari) {
        ctx.addIssue({ code: "custom", path: ["hari"], message: "Pilih hari" });
      }
      if (aturanJam === "wajib" && !x.jam) {
        ctx.addIssue({ code: "custom", path: ["jam"], message: "Jam wajib diisi" });
      }
    })
    .transform((x) => ({
      ...x,
      tanggal: x.pola === "tanggal" ? x.tanggal : "",
      hari: x.pola === "mingguan" ? x.hari : "",
      jam: aturanJam === "tanpa" ? "" : x.jam,
    }));
}

/**
 * Data lama (sebelum ada pilihan tanggal/rutin) disimpan sebagai
 * { hari, ustadz } (Kuliah Subuh), { hari, jam, ustadzah } (Pengajian Ibu),
 * atau { tanggal, jam, ustadz } (Pengajian Rabu). Saat dibaca, data tersebut
 * diubah ke bentuk baru tanpa ada yang hilang.
 */
export function migrasiKajian(nilai: unknown): unknown {
  if (nilai === null || typeof nilai !== "object" || Array.isArray(nilai)) return nilai;
  const o = nilai as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const tgl = str(o.tanggal);
  const hr = str(o.hari);
  let pola = o.pola === "tanggal" || o.pola === "mingguan" ? o.pola : tgl ? "tanggal" : "mingguan";
  if (pola === "tanggal" && !tgl && hr) pola = "mingguan";
  if (pola === "mingguan" && !hr && tgl) pola = "tanggal";
  return {
    ...o,
    pola,
    tanggal: pola === "tanggal" ? tgl : "",
    hari: pola === "mingguan" ? hr : "",
    jam: str(o.jam),
    ustadz: typeof o.ustadz === "string" ? o.ustadz : o.ustadzah,
  };
}

export const kajianItem = z.preprocess(
  migrasiKajian,
  kajianDasar
    .extend({ id, contoh })
    .refine((x) => (x.pola === "tanggal" ? x.tanggal !== "" : x.hari !== ""), "Jadwal kajian tidak lengkap"),
);
export type KajianItem = z.output<typeof kajianItem>;

export const JENIS_JADWAL = ["khotib", ...JENIS_KAJIAN] as const;
export type JenisJadwal = (typeof JENIS_JADWAL)[number];

export const inputJadwal = {
  khotib: khotibInput,
  pengajianRabu: kajianInput("wajib"),
  kuliahSubuh: kajianInput("tanpa"),
  pengajianIbu: kajianInput("wajib"),
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

/** Folder di Vercel Blob (`masjid/<folder>/<uuid>.webp`). */
export const FOLDER_FOTO = ["hero", "legalitas", "galeri", "logo", "kegiatan", "sejarah"] as const;
export type FolderFoto = (typeof FOLDER_FOTO)[number];

const POLA_URL_LOKAL = /^\/images\/[a-z0-9-]+\.svg$/;
const POLA_URL_BLOB = new RegExp(
  `^https://[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com/masjid/(${FOLDER_FOTO.join("|")})/[0-9a-f-]{36}\\.webp$`,
  "i",
);

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
export const logoSchema = fotoSchema.nullable();

/** Foto dalam daftar (kegiatan, sejarah) memiliki id sendiri untuk dihapus/dipindah. */
export const fotoBerIdSchema = fotoSchema.extend({ id });
export type FotoBerId = z.infer<typeof fotoBerIdSchema>;

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

/* --------------------------- Galeri ambulans --------------------------- */

export const keteranganGaleriSchema = teks("Keterangan", { min: 3, max: 200 });
export const tanggalGaleriSchema = tanggalAtauKosong;

export const galeriItem = z.object({
  id,
  foto: fotoSchema,
  keterangan: keteranganGaleriSchema,
  tanggal: tanggalGaleriSchema,
  contoh,
});

export type GaleriItem = z.infer<typeof galeriItem>;

/* ---------------------------- Kegiatan masjid ---------------------------- */

export const kegiatanInput = z.object({
  judul: teks("Nama kegiatan", { min: 3, max: 120 }),
  tanggal,
  keterangan: teksPanjang("Keterangan", { max: MAKS_KETERANGAN_KEGIATAN }),
});

export const kegiatanItem = kegiatanInput.extend({
  id,
  foto: z.array(fotoBerIdSchema).max(MAKS_FOTO_KEGIATAN),
  contoh,
});

export type KegiatanItem = z.infer<typeof kegiatanItem>;

/* ---------------------------- Sejarah masjid ---------------------------- */

export const narasiSejarahSchema = teksPanjang("Narasi sejarah", { max: MAKS_NARASI });
export const keteranganFotoSchema = teks("Keterangan foto", { max: 150 });

export const fotoSejarahSchema = fotoBerIdSchema.extend({ keterangan: keteranganFotoSchema });
export type FotoSejarah = z.infer<typeof fotoSejarahSchema>;

export const sejarahSchema = z.object({
  narasi: narasiSejarahSchema,
  foto: z.array(fotoSejarahSchema).max(MAKS_FOTO_SEJARAH),
});

export type Sejarah = z.infer<typeof sejarahSchema>;

/* ------------------------------ Pengumuman ------------------------------ */

const pengumumanDasar = z.object({
  teks: teks("Isi pengumuman", { min: 3, max: 250 }),
  mulai: tanggalAtauKosong,
  sampai: tanggalAtauKosong,
  /** Tampil juga di halaman depan website (selalu tampil di layar TV). */
  diWebsite: z.boolean(),
});

export const pengumumanInput = pengumumanDasar.refine((x) => !x.mulai || !x.sampai || x.mulai <= x.sampai, {
  path: ["sampai"],
  message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
});

export const pengumumanItem = pengumumanDasar.extend({ id, contoh });
export type PengumumanItem = z.infer<typeof pengumumanItem>;

/* ------------------------------ Suara adzan ------------------------------ */

const POLA_URL_AUDIO =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/masjid\/audio\/[0-9a-f-]{36}\.(mp3|m4a|ogg)$/i;

export const urlAudioSchema = z.string().max(300).regex(POLA_URL_AUDIO, "Alamat file audio tidak valid");

export const audioAdzanSchema = z.object({
  url: urlAudioSchema,
  pathname: z.string().max(200).regex(POLA_PATHNAME_AUDIO),
  ukuran: z.int().positive().max(UKURAN_MAKS_AUDIO),
  /** Nama file asli, hanya untuk ditampilkan di panel admin. */
  nama: teks("Nama file", { min: 1, max: 120 }),
});
export type AudioAdzan = z.infer<typeof audioAdzanSchema>;

export const adzanSchema = z.object({ umum: audioAdzanSchema.nullable(), subuh: audioAdzanSchema.nullable() });
export type Adzan = z.infer<typeof adzanSchema>;

/* ------------------------------ Layar TV ------------------------------ */

function menit(label: string, min: number, max: number, satuan = "menit") {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce
      .number({ error: `${label} wajib diisi angka` })
      .int(`${label} harus bilangan bulat`)
      .min(min, `${label} minimal ${min} ${satuan}`)
      .max(max, `${label} maksimal ${max} ${satuan}`),
  );
}

export const setelanTvSchema = z.object({
  iqomahSubuh: menit("Iqomah Subuh", 0, 30),
  iqomahDzuhur: menit("Iqomah Dzuhur", 0, 30),
  iqomahAshar: menit("Iqomah Ashar", 0, 30),
  iqomahMaghrib: menit("Iqomah Maghrib", 0, 30),
  iqomahIsya: menit("Iqomah Isya", 0, 30),
  durasiSholat: menit("Lama layar sholat", 0, 30),
  durasiJumat: menit("Lama layar Jumat", 0, 90),
  detikSlide: menit("Lama tiap tampilan", 5, 120, "detik"),
  // Field suara adzan ditambahkan belakangan: nilai bawaan dipakai bila
  // pengaturan lama di Redis belum memilikinya.
  adzanSubuh: z.boolean().default(true),
  adzanDzuhur: z.boolean().default(true),
  adzanAshar: z.boolean().default(true),
  adzanMaghrib: z.boolean().default(true),
  adzanIsya: z.boolean().default(true),
  /** Dzuhur hari Jumat: adzan biasanya dikumandangkan langsung saat khotib naik mimbar. */
  adzanJumat: z.boolean().default(false),
  volumeAdzan: menit("Volume adzan", 10, 100, "%").default(100),
});

export type SetelanTv = z.output<typeof setelanTvSchema>;

/* --------------------------- Kumpulan konten --------------------------- */

export const skemaKonten = {
  khotib: z.array(khotibItem).max(MAKS_JADWAL),
  pengajianRabu: z.array(kajianItem).max(MAKS_JADWAL),
  kuliahSubuh: z.array(kajianItem).max(MAKS_JADWAL),
  pengajianIbu: z.array(kajianItem).max(MAKS_JADWAL),
  countdown: countdownSchema,
  kontak: kontakSchema,
  legalitas: legalitasSchema,
  hero: heroSchema,
  galeri: z.array(galeriItem).max(MAKS_GALERI),
  pengumuman: z.array(pengumumanItem).max(MAKS_PENGUMUMAN),
  kegiatan: z.array(kegiatanItem).max(MAKS_KEGIATAN),
  sejarah: sejarahSchema,
  logo: logoSchema,
  tv: setelanTvSchema,
  adzan: adzanSchema,
} as const;

export type KunciKonten = keyof typeof skemaKonten;
export type Konten = { [K in KunciKonten]: z.output<(typeof skemaKonten)[K]> };
