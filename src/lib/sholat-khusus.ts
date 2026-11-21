import { keHijriah } from "./hijri";

/**
 * Sholat yang tidak rutin: sholat Ied (Idul Fitri, Idul Adha) dan sholat
 * gerhana. Jadwalnya diisi admin per tanggal, lengkap dengan khotib dan imam.
 * Modul ini tanpa zod supaya ringan dipakai di browser.
 */

export const JENIS_SHOLAT_KHUSUS = ["idulFitri", "idulAdha", "gerhanaBulan", "gerhanaMatahari"] as const;
export type JenisSholatKhusus = (typeof JENIS_SHOLAT_KHUSUS)[number];

export const INFO_SHOLAT_KHUSUS: Record<JenisSholatKhusus, { nama: string; singkat: string; ied: boolean }> = {
  idulFitri: { nama: "Sholat Idul Fitri", singkat: "Idul Fitri", ied: true },
  idulAdha: { nama: "Sholat Idul Adha", singkat: "Idul Adha", ied: true },
  gerhanaBulan: { nama: "Sholat Gerhana Bulan", singkat: "Gerhana Bulan", ied: false },
  gerhanaMatahari: { nama: "Sholat Gerhana Matahari", singkat: "Gerhana Matahari", ied: false },
};

type SholatKhusus = { jenis: JenisSholatKhusus; tanggal: string; jam: string };

/**
 * "Idul Fitri 1448 H" atau "Gerhana Bulan". Tahun Hijriah dihitung tanpa
 * koreksi: 1 Syawal dan 10 Dzulhijjah tidak pernah dekat pergantian tahun.
 */
export function labelSholatKhusus(x: Pick<SholatKhusus, "jenis" | "tanggal">): string {
  const info = INFO_SHOLAT_KHUSUS[x.jenis];
  return info.ied ? `${info.singkat} ${keHijriah(x.tanggal).tahun} H` : info.singkat;
}

/** Jadwal yang belum lewat, terdekat dulu. */
export function sholatKhususMendatang<T extends SholatKhusus>(items: T[], hariIni: string): T[] {
  return items
    .filter((x) => x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam));
}

/** Judul bagian di website: "Sholat Ied", "Sholat Gerhana", atau keduanya. */
export function judulBagianSholatKhusus(items: Pick<SholatKhusus, "jenis">[]): string {
  const ied = items.some((x) => INFO_SHOLAT_KHUSUS[x.jenis].ied);
  const gerhana = items.some((x) => !INFO_SHOLAT_KHUSUS[x.jenis].ied);
  if (ied && gerhana) return "Sholat Ied & Gerhana";
  return gerhana ? "Sholat Gerhana" : "Sholat Ied";
}
