import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { FormNarasiSejarah, KelolaFotoSejarah } from "@/components/admin/kelola-sejarah";
import { Kartu } from "@/components/admin/ui";
import { MAKS_FOTO_SEJARAH } from "@/lib/batas";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Sejarah Masjid" };
export const instant = false;

export default async function Halaman() {
  await wajibAdminHalaman();
  const sejarah = await bacaKonten("sejarah");
  return (
    <>
      <JudulHalaman
        judul="Sejarah Masjid"
        deskripsi="Ringkasan tampil di halaman depan; narasi dan semua foto tampil di halaman /sejarah."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Kartu judul="Narasi">
          <FormNarasiSejarah narasi={sejarah.narasi} />
        </Kartu>
        <Kartu
          judul={`Foto sejarah (${sejarah.foto.length}/${MAKS_FOTO_SEJARAH})`}
          deskripsi="Urutan foto bisa diatur dengan tombol panah, misalnya dari yang paling lama."
        >
          <KelolaFotoSejarah foto={sejarah.foto} />
        </Kartu>
      </div>
    </>
  );
}
