import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaJadwal } from "@/components/admin/kelola-jadwal";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Pengajian Ibu" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("pengajianIbu", hariIni);
  return (
    <>
      <JudulHalaman judul="Jadwal Pengajian Kaum Ibu" deskripsi="Majelis taklim muslimah per tanggal atau rutin setiap pekan. Pengisi bisa ustadzah maupun ustadz." />
      <KelolaJadwal jenis="pengajianIbu" items={items} hariIni={hariIni} />
    </>
  );
}
