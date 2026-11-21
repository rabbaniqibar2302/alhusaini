import type { Metadata } from "next";
import { FormTampilan } from "@/components/admin/form-tampilan";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Tampilan & Tema" };
export const instant = false;

export default async function HalamanTampilan() {
  await wajibAdminHalaman();
  const { tema } = await bacaKonten("tampilan");

  return (
    <>
      <JudulHalaman
        judul="Tampilan & Tema"
        deskripsi="Pilih warna website. Tema berlaku untuk website, layar TV, poster yang dibagikan, dan panel admin ini."
      />
      <FormTampilan tema={tema} />
    </>
  );
}
