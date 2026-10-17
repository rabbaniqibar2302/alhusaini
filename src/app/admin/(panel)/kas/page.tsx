import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaKas } from "@/components/admin/kelola-kas";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Kas Masjid" };
export const instant = false;

export default async function HalamanKas() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const [transaksi, setelan] = await Promise.all([bacaKonten("kas", hariIni), bacaKonten("setelanKas", hariIni)]);
  return (
    <>
      <JudulHalaman
        judul="Kas Masjid"
        deskripsi="Catat pemasukan dan pengeluaran. Laporan per periode tampil di website dan layar TV."
      />
      <KelolaKas transaksi={transaksi} setelan={setelan} hariIni={hariIni} />
    </>
  );
}
