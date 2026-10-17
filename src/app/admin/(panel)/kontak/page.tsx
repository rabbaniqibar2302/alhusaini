import type { Metadata } from "next";
import Link from "next/link";
import { FormKontak } from "@/components/admin/form-kontak";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Kontak" };
export const instant = false;

export default async function HalamanKontak() {
  await wajibAdminHalaman();
  const [kontak, identitas] = await Promise.all([bacaKonten("kontak"), bacaKonten("identitas")]);

  return (
    <>
      <JudulHalaman judul="Kontak Masjid" deskripsi="Informasi kontak yang tampil di bagian bawah (footer) halaman depan." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Kartu judul="Kontak pengurus">
          <FormKontak kontak={kontak} />
        </Kartu>
        <Kartu
          judul="Nama & alamat"
          deskripsi={
            <>
              Diubah di menu{" "}
              <Link href="/admin/identitas" className="font-semibold text-hijau-800 underline-offset-2 hover:underline">
                Identitas Masjid
              </Link>
              .
            </>
          }
        >
          <p className="text-sm font-semibold text-stone-800">{identitas.nama}</p>
          <p className="mt-1 text-sm text-stone-700">{identitas.alamat}</p>
        </Kartu>
      </div>
    </>
  );
}
