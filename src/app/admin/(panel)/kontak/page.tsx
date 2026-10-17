import type { Metadata } from "next";
import { FormKontak } from "@/components/admin/form-kontak";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { SITE } from "@/lib/site";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Kontak" };
export const instant = false;

export default async function HalamanKontak() {
  await wajibAdminHalaman();
  const kontak = await bacaKonten("kontak");

  return (
    <>
      <JudulHalaman judul="Kontak Masjid" deskripsi="Informasi kontak yang tampil di bagian bawah (footer) halaman depan." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Kartu judul="Kontak pengurus">
          <FormKontak kontak={kontak} />
        </Kartu>
        <Kartu judul="Alamat (tetap)" deskripsi="Alamat dan nama masjid diatur di kode (src/lib/site.ts).">
          <p className="text-sm text-stone-700">{SITE.alamat}</p>
        </Kartu>
      </div>
    </>
  );
}
