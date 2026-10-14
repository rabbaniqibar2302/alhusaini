import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaJadwal } from "@/components/admin/kelola-jadwal";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Khotib Jumat" };

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("khotib", hariIni);
  return (
    <>
      <JudulHalaman judul="Jadwal Khotib Jumat" deskripsi="Isi tanggal Jumat, nama khotib, imam, dan tema khutbah. Halaman depan menampilkan jadwal mulai hari ini." />
      <KelolaJadwal jenis="khotib" items={items} hariIni={hariIni} />
    </>
  );
}
