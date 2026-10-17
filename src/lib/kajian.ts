import type { KajianItem } from "./schemas";
import { HARI_PEKAN, NAMA_HARI, formatTanggal, tambahHari, tanggalBerikutnya } from "./time";

/**
 * Logika jadwal kajian (Pengajian Rabu, Kuliah Subuh, Pengajian Kaum Ibu).
 * Setiap jadwal bisa berupa tanggal tertentu atau rutin setiap pekan pada
 * hari tertentu. Modul ini tanpa zod supaya ringan dipakai di browser.
 */

export const JENIS_KAJIAN = ["pengajianRabu", "kuliahSubuh", "pengajianIbu"] as const;
export type JenisKajian = (typeof JENIS_KAJIAN)[number];

export const POLA_JADWAL = ["tanggal", "mingguan"] as const;
export type PolaJadwal = (typeof POLA_JADWAL)[number];

export const INFO_KAJIAN: Record<JenisKajian, { judul: string; singkat: string; keterangan: string }> = {
  pengajianRabu: { judul: "Pengajian Rabu", singkat: "Pengajian Rabu", keterangan: "Kajian rutin bersama para asatidz" },
  kuliahSubuh: { judul: "Kuliah Subuh", singkat: "Kuliah Subuh", keterangan: "Ba'da sholat Subuh berjamaah" },
  pengajianIbu: { judul: "Pengajian Kaum Ibu", singkat: "Pengajian Ibu", keterangan: "Majelis taklim muslimah" },
};

type WaktuKajian = { pola: PolaJadwal; tanggal: string; hari: string };

const urutanPekan = (hari: string) => HARI_PEKAN.indexOf(hari as (typeof HARI_PEKAN)[number]);

/** Tanggal pelaksanaan berikutnya (mulai `dari`), atau null bila jadwal bertanggal sudah lewat. */
export function tanggalBerikutKajian(x: WaktuKajian, dari: string): string | null {
  if (x.pola === "tanggal") return x.tanggal >= dari ? x.tanggal : null;
  const indeks = NAMA_HARI.indexOf(x.hari as (typeof NAMA_HARI)[number]);
  return indeks < 0 ? null : tanggalBerikutnya(dari, indeks, 1)[0];
}

/** Jadwal bertanggal yang sudah lewat (jadwal rutin tidak pernah lewat). */
export function kajianLewat(x: WaktuKajian, hariIni: string): boolean {
  return x.pola === "tanggal" && x.tanggal < hariIni;
}

/**
 * Urutan tampil di halaman depan: jadwal bertanggal yang belum lewat
 * (terdekat dulu, maksimal `maksBertanggal`), lalu jadwal rutin per hari.
 */
export function susunKajian<T extends KajianItem>(items: T[], hariIni: string, maksBertanggal = 6): T[] {
  const bertanggal = items
    .filter((x) => x.pola === "tanggal" && x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam))
    .slice(0, maksBertanggal);
  const rutin = items
    .filter((x) => x.pola === "mingguan")
    .sort((a, b) => urutanPekan(a.hari) - urutanPekan(b.hari) || a.jam.localeCompare(b.jam));
  return [...bertanggal, ...rutin];
}

/** "Ahad, 18 Oktober 2026" atau "Setiap Ahad". */
export function labelWaktuKajian(x: WaktuKajian, opsi: { singkat?: boolean } = {}): string {
  return x.pola === "tanggal" ? formatTanggal(x.tanggal, { hari: true, singkat: opsi.singkat }) : `Setiap ${x.hari}`;
}

/** "Pukul 19:30 WIB", "Ba'da Subuh" (kuliah subuh tanpa jam), atau undefined. */
export function labelJamKajian(jenis: JenisKajian, x: Pick<KajianItem, "jam">): string | undefined {
  if (x.jam) return `Pukul ${x.jam} WIB`;
  return jenis === "kuliahSubuh" ? "Ba'da Subuh" : undefined;
}

export type KejadianKajian = {
  kunci: string;
  jenis: JenisKajian;
  tanggal: string;
  jam: string;
  ustadz: string;
  materi: string;
  rutin: boolean;
};

// Kuliah subuh tanpa jam diurutkan paling pagi.
const kunciJam = (k: KejadianKajian) => k.jam || (k.jenis === "kuliahSubuh" ? "04:30" : "23:59");

/** Semua pelaksanaan kajian dalam `jumlahHari` hari mulai `dari` (untuk layar TV). */
export function kajianDalamRentang(
  sumber: Record<JenisKajian, KajianItem[]>,
  dari: string,
  jumlahHari: number,
): KejadianKajian[] {
  const sampai = tambahHari(dari, jumlahHari - 1);
  const hasil: KejadianKajian[] = [];
  for (const jenis of JENIS_KAJIAN) {
    for (const x of sumber[jenis]) {
      const dasar = { jenis, jam: x.jam, ustadz: x.ustadz, materi: x.materi, rutin: x.pola === "mingguan" };
      let t = tanggalBerikutKajian(x, dari);
      while (t && t <= sampai) {
        hasil.push({ ...dasar, kunci: `${x.id}-${t}`, tanggal: t });
        t = x.pola === "mingguan" ? tambahHari(t, 7) : null;
      }
    }
  }
  return hasil.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || kunciJam(a).localeCompare(kunciJam(b)));
}
