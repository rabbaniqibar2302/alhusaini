/** Jadwal sholat satu hari (jam dalam WIB, format HH:MM). */
export type JadwalHarian = {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  sumber: "kemenag" | "perhitungan";
  lokasi: string;
};
