import type { Metadata } from "next";
import { FormIdentitas } from "@/components/admin/form-identitas";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Identitas Masjid" };
export const instant = false;

export default async function HalamanIdentitas() {
  await wajibAdminHalaman();
  const identitas = await bacaKonten("identitas");

  return (
    <>
      <JudulHalaman
        judul="Identitas Masjid"
        deskripsi="Nama, nama Arab, dan alamat masjid yang tampil di website, layar TV, dan hasil pencarian Google."
      />
      <FormIdentitas identitas={identitas} />
    </>
  );
}
