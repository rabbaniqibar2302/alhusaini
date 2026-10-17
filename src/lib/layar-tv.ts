import type { SetelanTv } from "./schemas";
import { epochWIB, hariKe, tambahHari } from "./time";
import type { JadwalHarian } from "./tipe-jadwal-sholat";

/**
 * Logika layar TV masjid: fase di sekitar waktu sholat (adzan → iqomah →
 * sholat berlangsung) dan hitung mundur ke sholat berikutnya. Tanpa zod dan
 * tanpa React supaya mudah diuji.
 */

export const SETELAN_TV_BAWAAN: SetelanTv = {
  iqomahSubuh: 10,
  iqomahDzuhur: 10,
  iqomahAshar: 10,
  iqomahMaghrib: 7,
  iqomahIsya: 10,
  durasiSholat: 10,
  durasiJumat: 45,
  detikSlide: 15,
};

export const WAKTU_SHOLAT = [
  { kunci: "subuh", label: "Subuh", iqomah: "iqomahSubuh" },
  { kunci: "dzuhur", label: "Dzuhur", iqomah: "iqomahDzuhur" },
  { kunci: "ashar", label: "Ashar", iqomah: "iqomahAshar" },
  { kunci: "maghrib", label: "Maghrib", iqomah: "iqomahMaghrib" },
  { kunci: "isya", label: "Isya", iqomah: "iqomahIsya" },
] as const;

export type KunciSholat = (typeof WAKTU_SHOLAT)[number]["kunci"];

export type SholatTerjadwal = { kunci: KunciSholat; label: string; jam: string; epoch: number };

export type FaseTv =
  | { jenis: "normal"; berikut: SholatTerjadwal }
  /** Setelah adzan, menunggu iqomah (selesai = saat iqomah). */
  | { jenis: "iqomah"; sholat: SholatTerjadwal; selesai: number }
  | { jenis: "sholat"; sholat: SholatTerjadwal; selesai: number }
  /** Hari Jumat sejak masuk waktu Dzuhur: khutbah & sholat Jumat. */
  | { jenis: "jumat"; sholat: SholatTerjadwal; selesai: number };

const MENIT = 60_000;

export function hitungFase(
  sekarang: number,
  hariIni: JadwalHarian,
  besok: Pick<JadwalHarian, "tanggal" | "subuh"> | null,
  setelan: SetelanTv,
): FaseTv {
  const jumat = hariKe(hariIni.tanggal) === 5;
  for (const w of WAKTU_SHOLAT) {
    const jam = hariIni[w.kunci];
    const mulai = epochWIB(hariIni.tanggal, jam);
    const sholat = { kunci: w.kunci, label: jumat && w.kunci === "dzuhur" ? "Jumat" : w.label, jam, epoch: mulai };
    if (sekarang < mulai) return { jenis: "normal", berikut: sholat };

    if (jumat && w.kunci === "dzuhur") {
      const selesai = mulai + setelan.durasiJumat * MENIT;
      if (sekarang < selesai) return { jenis: "jumat", sholat, selesai };
      continue;
    }
    const iqomah = mulai + setelan[w.iqomah] * MENIT;
    if (sekarang < iqomah) return { jenis: "iqomah", sholat, selesai: iqomah };
    const selesai = iqomah + setelan.durasiSholat * MENIT;
    if (sekarang < selesai) return { jenis: "sholat", sholat, selesai };
  }

  const tanggalBesok = tambahHari(hariIni.tanggal, 1);
  const jamSubuh = besok?.tanggal === tanggalBesok ? besok.subuh : hariIni.subuh;
  return {
    jenis: "normal",
    berikut: { kunci: "subuh", label: "Subuh", jam: jamSubuh, epoch: epochWIB(tanggalBesok, jamSubuh) },
  };
}

/** "01:23:45" (atau "23:45" bila kurang dari satu jam dan `ringkas`). */
export function formatHitungMundur(ms: number, ringkas = false): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const j = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const d = total % 60;
  const dua = (n: number) => String(n).padStart(2, "0");
  return ringkas && j === 0 ? `${dua(m)}:${dua(d)}` : `${dua(j)}:${dua(m)}:${dua(d)}`;
}
