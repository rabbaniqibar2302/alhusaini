import { dariHijriah, keHijriah } from "./hijri";
import type { CountdownSetting, KunciAcara } from "./schemas";
import { selisihHari } from "./time";

export const ACARA: Record<
  KunciAcara,
  { bulan: number; hari: number; label: string; judul: string; ucapan: string }
> = {
  ramadhan: {
    bulan: 9,
    hari: 1,
    label: "1 Ramadhan",
    judul: "Awal Ramadhan",
    ucapan: "Marhaban ya Ramadhan",
  },
  syawwal: {
    bulan: 10,
    hari: 1,
    label: "1 Syawwal",
    judul: "Hari Raya Idul Fitri",
    ucapan: "Selamat Hari Raya Idul Fitri",
  },
  "idul-adha": {
    bulan: 12,
    hari: 10,
    label: "10 Dzulhijjah",
    judul: "Hari Raya Idul Adha",
    ucapan: "Selamat Hari Raya Idul Adha",
  },
};

export type Kejadian = {
  acara: KunciAcara;
  tahunHijriah: number;
  /** Tanggal yang dipakai (YYYY-MM-DD, mulai 00:00 WIB). */
  tanggal: string;
  /** Tanggal perkiraan otomatis dari kalender Hijriah (sudah termasuk koreksi). */
  otomatis: string;
  sumber: "otomatis" | "penetapan";
  catatan: string;
};

/** Selisih maksimal tanggal penetapan dari perkiraan kalender (hari). */
export const BATAS_SELISIH_PENETAPAN = 5;

/** Tanggal perkiraan murni (Umm al-Qura tanpa koreksi) untuk validasi penetapan. */
export function tanggalPerkiraan(acara: KunciAcara, tahunHijriah: number, koreksi = 0): string {
  const a = ACARA[acara];
  return dariHijriah(tahunHijriah, a.bulan, a.hari, koreksi);
}

export function penetapanMasukAkal(acara: KunciAcara, tahunHijriah: number, tanggal: string): boolean {
  return Math.abs(selisihHari(tanggalPerkiraan(acara, tahunHijriah), tanggal)) <= BATAS_SELISIH_PENETAPAN;
}

/**
 * Kejadian berikutnya (yang harinya belum lewat) untuk sebuah acara.
 * Penetapan admin menggantikan perkiraan untuk tahun Hijriah yang sama, jadi
 * setelah tanggal penetapan lewat, hitung mundur otomatis pindah ke tahun
 * Hijriah berikutnya.
 */
export function kejadianBerikutnya(
  acara: KunciAcara,
  hariIni: string,
  setelan: CountdownSetting,
  jumlah = 2,
): Kejadian[] {
  const { tahun } = keHijriah(hariIni, setelan.koreksiHijriah);
  const hasil: Kejadian[] = [];
  for (let th = tahun - 1; th <= tahun + 3 && hasil.length < jumlah; th++) {
    const otomatis = tanggalPerkiraan(acara, th, setelan.koreksiHijriah);
    const p = setelan.penetapan.find((x) => x.acara === acara && x.tahunHijriah === th);
    const tanggal = p?.tanggal ?? otomatis;
    if (tanggal >= hariIni) {
      hasil.push({
        acara,
        tahunHijriah: th,
        tanggal,
        otomatis,
        sumber: p ? "penetapan" : "otomatis",
        catatan: p?.catatan ?? "",
      });
    }
  }
  return hasil;
}
