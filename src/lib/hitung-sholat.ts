import { CalculationParameters, Coordinates, Madhab, PrayerTimes, Rounding } from "adhan";
import { LOKASI_SHOLAT } from "./site";
import { WIB_OFFSET_MS } from "./time";
import type { JadwalHarian } from "./tipe-jadwal-sholat";

export type WaktuSholat = Omit<JadwalHarian, "tanggal" | "sumber" | "lokasi">;

function jamWIB(t: Date): string {
  return new Date(t.getTime() + WIB_OFFSET_MS).toISOString().slice(11, 16);
}

/**
 * Perhitungan jadwal sholat dengan parameter Kemenag (Subuh 20°, Isya 18°,
 * dikalibrasi ±1 menit). Dipakai server bila API myQuran tidak dapat
 * dihubungi, dan oleh layar TV bila datanya belum diperbarui (mis. internet
 * di masjid sedang putus).
 */
export function hitungJadwalLokal(tanggal: string): WaktuSholat {
  const [y, m, d] = tanggal.split("-").map(Number);
  const p = new CalculationParameters("Other", 20, 18);
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.Up;
  p.adjustments = { fajr: 0, sunrise: -2, dhuhr: 1, asr: 0, maghrib: 1, isha: 0 };
  // adhan membaca komponen tanggal lokal, jadi bentuk Date lokal y/m/d.
  const { lat, lng } = LOKASI_SHOLAT.koordinat;
  const w = new PrayerTimes(new Coordinates(lat, lng), new Date(y, m - 1, d), p);
  return {
    imsak: jamWIB(new Date(w.fajr.getTime() - 10 * 60 * 1000)),
    subuh: jamWIB(w.fajr),
    terbit: jamWIB(w.sunrise),
    dzuhur: jamWIB(w.dhuhr),
    ashar: jamWIB(w.asr),
    maghrib: jamWIB(w.maghrib),
    isya: jamWIB(w.isha),
  };
}

export function jadwalPerhitungan(tanggal: string): JadwalHarian {
  return { tanggal, ...hitungJadwalLokal(tanggal), sumber: "perhitungan", lokasi: LOKASI_SHOLAT.kota };
}
