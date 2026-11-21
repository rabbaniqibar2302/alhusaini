import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaJadwal } from "@/components/admin/kelola-jadwal";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Sholat Ied & Gerhana" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const [items, penceramah] = await Promise.all([bacaKonten("sholatKhusus", hariIni), bacaKonten("penceramah", hariIni)]);
  return (
    <>
      <JudulHalaman
        judul="Sholat Ied & Gerhana"
        deskripsi="Jadwal sholat Idul Fitri, Idul Adha, dan sholat gerhana. Tampil di halaman depan dan layar TV sampai hari pelaksanaannya."
      />
      <KelolaJadwal jenis="sholatKhusus" items={items} hariIni={hariIni} penceramah={penceramah} />
    </>
  );
}
