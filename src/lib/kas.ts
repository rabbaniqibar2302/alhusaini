import type { SetelanKas, TransaksiKas } from "./schemas";
import { NAMA_BULAN } from "./time";

/**
 * Laporan kas masjid: saldo dihitung dari saldo awal + semua transaksi.
 * Laporan menampilkan `periodeBulan` bulan terakhir (termasuk bulan berjalan).
 * Tanpa zod supaya ringan dipakai di browser (layar TV).
 */

export const SETELAN_KAS_BAWAAN: SetelanKas = { saldoAwal: 0, periodeBulan: 3, tampilWebsite: true, tampilTv: true };

const formatter = new Intl.NumberFormat("id-ID");

/** "Rp 1.250.000" (negatif: "−Rp 1.250.000"). */
export function formatRupiah(n: number): string {
  return `${n < 0 ? "−" : ""}Rp ${formatter.format(Math.abs(n))}`;
}

/** Angka saja dengan pemisah ribuan, untuk isian form: "1.250.000". */
export function formatAngka(n: number): string {
  return formatter.format(n);
}

/** "2026-10" → "Oktober 2026". */
export function labelBulan(bulan: string): string {
  const [y, m] = bulan.split("-").map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
}

/** Bulan ke-`n` sebelum/sesudah "YYYY-MM". */
export function geserBulan(bulan: string, n: number): string {
  const [y, m] = bulan.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const nilai = (t: Pick<TransaksiKas, "jenis" | "jumlah">) => (t.jenis === "masuk" ? t.jumlah : -t.jumlah);

export type BulanKas = {
  bulan: string;
  label: string;
  saldoAwal: number;
  masuk: number;
  keluar: number;
  saldoAkhir: number;
  /** Terbaru di atas. */
  transaksi: TransaksiKas[];
};

export type RingkasanKas = {
  periodeLabel: string;
  saldoAwal: number;
  masuk: number;
  keluar: number;
  saldoAkhir: number;
  /** Bulan terbaru di atas. */
  bulan: BulanKas[];
  /** Tanggal transaksi terakhir yang dicatat (untuk "per tanggal"). */
  terakhir: string | null;
  jumlahTransaksi: number;
};

/** Urutan transaksi: terbaru di atas; yang dicatat belakangan di atas bila tanggalnya sama. */
export function urutkanTransaksi(daftar: TransaksiKas[]): TransaksiKas[] {
  return daftar
    .map((t, i) => [t, i] as const)
    .sort(([a, i], [b, j]) => b.tanggal.localeCompare(a.tanggal) || j - i)
    .map(([t]) => t);
}

export function ringkasanKas(
  transaksi: TransaksiKas[],
  setelan: Pick<SetelanKas, "saldoAwal" | "periodeBulan">,
  hariIni: string,
): RingkasanKas {
  const bulanIni = hariIni.slice(0, 7);
  const bulanMulai = geserBulan(bulanIni, -(setelan.periodeBulan - 1));
  const mulai = `${bulanMulai}-01`;

  let saldo = setelan.saldoAwal;
  for (const t of transaksi) if (t.tanggal < mulai) saldo += nilai(t);
  const saldoAwal = saldo;

  const bulan: BulanKas[] = [];
  for (let b = bulanMulai; b <= bulanIni; b = geserBulan(b, 1)) {
    const isi = transaksi.filter((t) => t.tanggal.startsWith(b));
    const masuk = isi.filter((t) => t.jenis === "masuk").reduce((a, t) => a + t.jumlah, 0);
    const keluar = isi.filter((t) => t.jenis === "keluar").reduce((a, t) => a + t.jumlah, 0);
    bulan.push({ bulan: b, label: labelBulan(b), saldoAwal: saldo, masuk, keluar, saldoAkhir: saldo + masuk - keluar, transaksi: urutkanTransaksi(isi) });
    saldo += masuk - keluar;
  }
  // Transaksi bertanggal setelah bulan berjalan (seharusnya tidak ada) tetap ikut saldo akhir.
  for (const t of transaksi) if (t.tanggal.slice(0, 7) > bulanIni) saldo += nilai(t);

  const masuk = bulan.reduce((a, b) => a + b.masuk, 0);
  const keluar = bulan.reduce((a, b) => a + b.keluar, 0);
  const terakhir = transaksi.reduce<string | null>((a, t) => (a === null || t.tanggal > a ? t.tanggal : a), null);
  return {
    periodeLabel:
      setelan.periodeBulan === 1 ? labelBulan(bulanIni) : `${labelBulan(bulanMulai)} – ${labelBulan(bulanIni)}`,
    saldoAwal,
    masuk,
    keluar,
    saldoAkhir: saldo,
    bulan: bulan.reverse(),
    terakhir,
    jumlahTransaksi: transaksi.length,
  };
}

/** Ada yang layak ditampilkan (transaksi atau saldo awal). */
export function adaLaporanKas(transaksi: TransaksiKas[], setelan: Pick<SetelanKas, "saldoAwal">): boolean {
  return transaksi.length > 0 || setelan.saldoAwal > 0;
}
