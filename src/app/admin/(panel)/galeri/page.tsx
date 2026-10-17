import type { Metadata } from "next";
import { FormTambahGaleri, KartuItemGaleri } from "@/components/admin/form-foto";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { MAKS_GALERI } from "@/lib/schemas";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Galeri Ambulans" };
export const instant = false;

export default async function HalamanGaleri() {
  await wajibAdminHalaman();
  const galeri = await bacaKonten("galeri");

  return (
    <>
      <JudulHalaman
        judul="Galeri Kegiatan Ambulans"
        deskripsi={`Foto terbaru tampil paling depan. Maksimal ${MAKS_GALERI} foto.`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Kartu judul="Tambah foto">
          <FormTambahGaleri />
        </Kartu>
        <Kartu judul={`Foto di galeri (${galeri.length})`}>
          {galeri.length === 0 ? (
            <p className="text-sm text-stone-500">Belum ada foto.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {galeri.map((item) => (
                <KartuItemGaleri key={item.id} item={item} />
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </>
  );
}
