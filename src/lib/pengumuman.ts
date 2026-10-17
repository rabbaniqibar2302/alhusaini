/** Pengumuman yang masa tampilnya mencakup `hariIni` (kosong = tanpa batas). */
export function pengumumanAktif<T extends { mulai: string; sampai: string }>(items: T[], hariIni: string): T[] {
  return items.filter((x) => (!x.mulai || x.mulai <= hariIni) && (!x.sampai || x.sampai >= hariIni));
}

/** Pengumuman yang masa tampilnya sudah berakhir. */
export function pengumumanBerakhir(x: { sampai: string }, hariIni: string): boolean {
  return x.sampai !== "" && x.sampai < hariIni;
}
