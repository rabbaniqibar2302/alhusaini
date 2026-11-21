import type { JadwalHarian } from "./tipe-jadwal-sholat";
import { epochWIB, hariKe, tambahHari, tanggalWIB } from "./time";

/**
 * Waktu sholat berikutnya dari jadwal hari ini & besok. Dipakai kartu jadwal
 * sholat di halaman depan dan tombol sholat di navigasi bawah HP; dihitung di
 * browser dengan jam perangkat, jadi tetap tepat walau halaman dari cache.
 */

export type KunciWaktu = "imsak" | "subuh" | "terbit" | "dzuhur" | "ashar" | "maghrib" | "isya";

export const DAFTAR_WAKTU: { kunci: KunciWaktu; label: string; sholat: boolean }[] = [
  { kunci: "imsak", label: "Imsak", sholat: false },
  { kunci: "subuh", label: "Subuh", sholat: true },
  { kunci: "terbit", label: "Terbit", sholat: false },
  { kunci: "dzuhur", label: "Dzuhur", sholat: true },
  { kunci: "ashar", label: "Ashar", sholat: true },
  { kunci: "maghrib", label: "Maghrib", sholat: true },
  { kunci: "isya", label: "Isya", sholat: true },
];

const SATU_HARI = 24 * 60 * 60 * 1000;

/** Dzuhur di hari Jumat ditampilkan sebagai "Jumat". */
export function labelWaktu(jadwal: Pick<JadwalHarian, "tanggal">, kunci: KunciWaktu, label: string): string {
  return kunci === "dzuhur" && hariKe(jadwal.tanggal) === 5 ? "Jumat" : label;
}

/** Jadwal untuk tanggal `sekarang` (WIB); bila tidak ada, jadwal pertama dan `usang` = true. */
export function jadwalUntuk(hari: JadwalHarian[], sekarang: number | null): { jadwal: JadwalHarian; usang: boolean } {
  if (sekarang === null) return { jadwal: hari[0], usang: false };
  const tanggal = tanggalWIB(sekarang);
  const jadwal = hari.find((h) => h.tanggal === tanggal);
  return jadwal ? { jadwal, usang: false } : { jadwal: hari[0], usang: true };
}

export type SholatBerikutnya = {
  kunci: KunciWaktu;
  label: string;
  jam: string;
  epoch: number;
  /** Waktu sholat sebelumnya (untuk bilah kemajuan menuju adzan). */
  epochSebelumnya: number;
};

/** null bila jadwal untuk hari ini tidak tersedia (halaman cache sudah usang). */
export function sholatBerikutnya(hari: JadwalHarian[], sekarang: number): SholatBerikutnya | null {
  const { jadwal, usang } = jadwalUntuk(hari, sekarang);
  if (usang) return null;
  const sholat = DAFTAR_WAKTU.filter((w) => w.sholat);
  let sebelumnya = epochWIB(jadwal.tanggal, jadwal.isya) - SATU_HARI; // perkiraan Isya kemarin
  for (const w of sholat) {
    const epoch = epochWIB(jadwal.tanggal, jadwal[w.kunci]);
    if (epoch > sekarang) {
      return { kunci: w.kunci, label: labelWaktu(jadwal, w.kunci, w.label), jam: jadwal[w.kunci], epoch, epochSebelumnya: sebelumnya };
    }
    sebelumnya = epoch;
  }
  const besok = tambahHari(jadwal.tanggal, 1);
  const jamSubuh = hari.find((h) => h.tanggal === besok)?.subuh ?? jadwal.subuh;
  return { kunci: "subuh", label: "Subuh", jam: jamSubuh, epoch: epochWIB(besok, jamSubuh), epochSebelumnya: sebelumnya };
}

/** "01:02:03" */
export function formatDurasi(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const j = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const d = total % 60;
  return [j, m, d].map((n) => String(n).padStart(2, "0")).join(":");
}
