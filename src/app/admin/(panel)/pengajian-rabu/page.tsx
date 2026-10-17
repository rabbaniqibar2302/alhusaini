import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaJadwal } from "@/components/admin/kelola-jadwal";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Pengajian Rabu" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const [items, penceramah] = await Promise.all([bacaKonten("pengajianRabu", hariIni), bacaKonten("penceramah", hariIni)]);
  return (
    <>
      <JudulHalaman judul="Jadwal Pengajian Rabu" deskripsi="Atur per tanggal atau rutin setiap pekan: jam, ustadz/ustadzah, dan materi." />
      <KelolaJadwal jenis="pengajianRabu" items={items} hariIni={hariIni} penceramah={penceramah} />
    </>
  );
}
