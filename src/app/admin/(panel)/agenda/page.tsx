import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaAgenda } from "@/components/admin/kelola-agenda";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Agenda Event" };
export const instant = false;

export default async function HalamanAgenda() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const items = await bacaKonten("agenda", hariIni);
  return (
    <>
      <JudulHalaman
        judul="Agenda Event"
        deskripsi="Acara yang akan datang di masjid, lengkap dengan poster, tanggal, jam, dan lokasi."
      />
      <KelolaAgenda items={items} hariIni={hariIni} />
    </>
  );
}
