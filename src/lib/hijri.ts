import { tambahHari } from "./time";

/**
 * Konversi kalender Hijriah berbasis kalender Umm al-Qura (ICU/Intl, tersedia
 * penuh di Node.js). Kalender ini bisa berbeda ±1 hari dari keputusan sidang
 * isbat Kemenag, sehingga admin dapat memberi koreksi hari dan menetapkan
 * tanggal resmi per acara (lihat countdown.ts).
 */

export const NAMA_BULAN_HIJRIAH = [
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawwal",
  "Dzulqa'dah",
  "Dzulhijjah",
] as const;

export type TanggalHijriah = { tahun: number; bulan: number; hari: number };

let formatter: Intl.DateTimeFormat | undefined;

function getFormatter(): Intl.DateTimeFormat {
  formatter ??= new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  return formatter;
}

function isoKeUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Tanggal Umm al-Qura murni (tanpa koreksi) untuk tanggal Masehi `iso`. */
function ummAlQura(iso: string): TanggalHijriah {
  const parts = getFormatter().formatToParts(isoKeUtc(iso));
  const ambil = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { tahun: ambil("year"), bulan: ambil("month"), hari: ambil("day") };
}

/** Perkiraan kalender Hijriah tabular (aritmetika) sebagai titik awal pencarian. */
function hijriahTabularKeIso(tahun: number, bulan: number, hari: number): string {
  const jd =
    hari +
    Math.ceil(29.5 * (bulan - 1)) +
    (tahun - 1) * 354 +
    Math.floor((3 + 11 * tahun) / 30) +
    1948439.5 -
    1;
  const t = new Date(Math.round((jd - 2440587.5) * 86400000));
  return t.toISOString().slice(0, 10);
}

/**
 * Tanggal Hijriah untuk tanggal Masehi `iso`.
 * `koreksi` = +1 berarti kalender yang dipakai dimulai 1 hari lebih lambat
 * daripada Umm al-Qura (sering terjadi di Indonesia).
 */
export function keHijriah(iso: string, koreksi = 0): TanggalHijriah {
  return ummAlQura(tambahHari(iso, -koreksi));
}

/** Tanggal Masehi (YYYY-MM-DD) untuk tanggal Hijriah tertentu. */
export function dariHijriah(tahun: number, bulan: number, hari: number, koreksi = 0): string {
  const perkiraan = hijriahTabularKeIso(tahun, bulan, hari);
  for (const geser of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
    const kandidat = tambahHari(perkiraan, geser);
    const h = ummAlQura(kandidat);
    if (h.tahun === tahun && h.bulan === bulan && h.hari === hari) {
      return tambahHari(kandidat, koreksi);
    }
  }
  return tambahHari(perkiraan, koreksi);
}

export function formatHijriah(h: TanggalHijriah): string {
  return `${h.hari} ${NAMA_BULAN_HIJRIAH[h.bulan - 1]} ${h.tahun} H`;
}
