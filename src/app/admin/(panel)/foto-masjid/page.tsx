import type { Metadata } from "next";
import Image from "next/image";
import { FormFotoMasjid, TombolHapusFotoMasjid } from "@/components/admin/form-foto";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Foto Masjid" };

export default async function HalamanFotoMasjid() {
  await wajibAdminHalaman();
  const foto = await bacaKonten("hero");

  return (
    <>
      <JudulHalaman
        judul="Foto Masjid"
        deskripsi="Foto utama yang tampil di bagian atas halaman depan. Gunakan foto mendatar (landscape) yang terang."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Kartu judul="Foto saat ini">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-hijau-950 ring-1 ring-stone-200">
            <Image
              src={foto?.url ?? "/images/masjid-ilustrasi.svg"}
              alt="Foto masjid saat ini"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              unoptimized={!foto}
              className="object-cover"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-600">
              {foto ? `${foto.lebar} × ${foto.tinggi} piksel` : "Belum ada foto — halaman depan memakai ilustrasi bawaan."}
            </p>
            {foto && <TombolHapusFotoMasjid />}
          </div>
        </Kartu>
        <Kartu
          judul="Unggah foto baru"
          deskripsi="Foto otomatis diperkecil (maks. 2000 px), data lokasi/EXIF dihapus, dan disimpan sebagai WEBP."
        >
          <FormFotoMasjid />
        </Kartu>
      </div>
    </>
  );
}
