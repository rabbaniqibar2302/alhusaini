/**
 * Utilitas tanggal & jam dalam zona WIB (UTC+7, tanpa daylight saving).
 * Semua tanggal disimpan sebagai string "YYYY-MM-DD" dan jam sebagai "HH:MM".
 * Dipakai di server maupun browser, jadi modul ini tidak boleh bergantung pada
 * zona waktu perangkat.
 */

export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const NAMA_HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Hari dalam urutan pekan Indonesia (Senin pertama) untuk jadwal mingguan. */
export const HARI_PEKAN = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"] as const;
export type Hari = (typeof HARI_PEKAN)[number];

const pad = (n: number) => String(n).padStart(2, "0");

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

/** Tanggal hari ini (atau `now`) di WIB, format YYYY-MM-DD. */
export function tanggalWIB(now: number = Date.now()): string {
  const d = new Date(now + WIB_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Jumlah menit sejak 00:00 WIB untuk waktu `now`. */
export function menitWIB(now: number = Date.now()): number {
  const d = new Date(now + WIB_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function tambahHari(iso: string, n: number): string {
  const [y, m, d] = parseIso(iso);
  const t = new Date(Date.UTC(y, m - 1, d) + n * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Selisih hari kalender (b - a). */
export function selisihHari(a: string, b: string): number {
  const [ay, am, ad] = parseIso(a);
  const [by, bm, bd] = parseIso(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY_MS);
}

/** Epoch (ms) untuk tanggal & jam WIB tertentu. */
export function epochWIB(iso: string, jam = "00:00"): number {
  const [y, m, d] = parseIso(iso);
  const [hh, mm] = jam.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - WIB_OFFSET_MS;
}

/** 0 = Ahad ... 6 = Sabtu */
export function hariKe(iso: string): number {
  const [y, m, d] = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function namaHari(iso: string): string {
  return NAMA_HARI[hariKe(iso)];
}

/** "16 Oktober 2026" atau "Jumat, 16 Oktober 2026" */
export function formatTanggal(iso: string, opts: { hari?: boolean; singkat?: boolean } = {}): string {
  const [y, m, d] = parseIso(iso);
  const bulan = opts.singkat ? NAMA_BULAN[m - 1].slice(0, 3) : NAMA_BULAN[m - 1];
  const teks = `${d} ${bulan} ${y}`;
  return opts.hari ? `${namaHari(iso)}, ${teks}` : teks;
}

/** Tanggal-tanggal mendatang (mulai `dari`, inklusif) yang jatuh pada hari tertentu. */
export function tanggalBerikutnya(dari: string, hari: number, jumlah: number): string[] {
  const hasil: string[] = [];
  let t = tambahHari(dari, (hari - hariKe(dari) + 7) % 7);
  while (hasil.length < jumlah) {
    hasil.push(t);
    t = tambahHari(t, 7);
  }
  return hasil;
}

export function isTanggalValid(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = parseIso(iso);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export const JAM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
