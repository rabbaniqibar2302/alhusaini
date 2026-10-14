import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaJadwal } from "@/components/admin/kelola-jadwal";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Pengajian Rabu" };

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("pengajianRabu", hariIni);
  return (
    <>
      <JudulHalaman judul="Jadwal Pengajian Rabu" deskripsi="Kajian rutin hari Rabu: tanggal, jam, ustadz, dan materi." />
      <KelolaJadwal jenis="pengajianRabu" items={items} hariIni={hariIni} />
    </>
  );
}
