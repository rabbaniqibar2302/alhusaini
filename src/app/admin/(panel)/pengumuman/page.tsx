import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaPengumuman } from "@/components/admin/kelola-pengumuman";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Pengumuman" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("pengumuman", hariIni);
  return (
    <>
      <JudulHalaman
        judul="Pengumuman"
        deskripsi="Tampil sebagai teks berjalan di layar TV masjid. Centang 'website' untuk menampilkannya juga di halaman depan."
      />
      <KelolaPengumuman items={items} hariIni={hariIni} />
    </>
  );
}
