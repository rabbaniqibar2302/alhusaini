import type { AgendaItem } from "./schemas";
import { formatTanggal, selisihHari } from "./time";

/** Agenda yang belum selesai, terdekat dulu. */
export function agendaMendatang<T extends Pick<AgendaItem, "tanggal" | "tanggalSelesai">>(items: T[], hariIni: string): T[] {
  return items
    .filter((x) => (x.tanggalSelesai || x.tanggal) >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

export function agendaLewat(x: Pick<AgendaItem, "tanggal" | "tanggalSelesai">, hariIni: string): boolean {
  return (x.tanggalSelesai || x.tanggal) < hariIni;
}

/**
 * "Sabtu, 24 Okt 2026" atau "24–26 Okt 2026" / "30 Okt – 1 Nov 2026";
 * dengan `singkat: false` nama bulan ditulis lengkap.
 */
export function labelTanggalAgenda(
  x: Pick<AgendaItem, "tanggal" | "tanggalSelesai">,
  { singkat = true }: { singkat?: boolean } = {},
): string {
  if (!x.tanggalSelesai || x.tanggalSelesai === x.tanggal) return formatTanggal(x.tanggal, { hari: true, singkat });
  const [a, b] = [formatTanggal(x.tanggal, { singkat }), formatTanggal(x.tanggalSelesai, { singkat })];
  const [ta, ba, ya] = a.split(" ");
  const [, bb, yb] = b.split(" ");
  if (ya !== yb) return `${a} – ${b}`;
  if (ba !== bb) return `${ta} ${ba} – ${b}`;
  return `${ta}–${b}`;
}

/** "Hari ini", "Besok", "3 hari lagi", atau "Sedang berlangsung". */
export function hitungMundurAgenda(x: Pick<AgendaItem, "tanggal" | "tanggalSelesai">, hariIni: string): string {
  const sisa = selisihHari(hariIni, x.tanggal);
  if (sisa > 1) return `${sisa} hari lagi`;
  if (sisa === 1) return "Besok";
  if (sisa === 0) return "Hari ini";
  return "Sedang berlangsung";
}
