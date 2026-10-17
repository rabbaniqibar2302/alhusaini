import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaKegiatan } from "@/components/admin/kelola-kegiatan";
import { MAKS_FOTO_KEGIATAN, MAKS_KEGIATAN } from "@/lib/batas";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Kegiatan Masjid" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("kegiatan", hariIni);
  return (
    <>
      <JudulHalaman
        judul="Kegiatan Masjid"
        deskripsi={`Foto dan keterangan kegiatan tampil di halaman depan dan halaman /kegiatan. Maksimal ${MAKS_KEGIATAN} kegiatan, ${MAKS_FOTO_KEGIATAN} foto per kegiatan.`}
      />
      <KelolaKegiatan items={items} hariIni={hariIni} />
    </>
  );
}
