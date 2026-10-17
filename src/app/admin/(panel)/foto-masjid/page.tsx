import type { Metadata } from "next";
import Image from "next/image";
import { FormFotoMasjid, FormLogo, TombolHapusFotoMasjid, TombolHapusLogo } from "@/components/admin/form-foto";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { LogoMasjid } from "@/components/logo-masjid";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Logo & Foto Masjid" };
export const instant = false;

export default async function HalamanFotoMasjid() {
  await wajibAdminHalaman();
  const [foto, logo] = await Promise.all([bacaKonten("hero"), bacaKonten("logo")]);

  return (
    <>
      <JudulHalaman
        judul="Logo & Foto Masjid"
        deskripsi="Logo tampil di header, footer, dan layar TV. Foto utama tampil di bagian atas halaman depan dan layar TV."
      />
      <h2 className="mb-3 text-lg font-bold text-hijau-900">Logo masjid</h2>
      <div className="mb-8 grid items-start gap-6 lg:grid-cols-2">
        <Kartu judul="Logo saat ini">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-hijau-950 p-5">
              <LogoMasjid logo={logo} className="size-20" ikonClassName="size-10" sizes="160px" />
              <span className="text-xs text-hijau-100">Di atas latar gelap</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-krem p-5 ring-1 ring-stone-200">
              <LogoMasjid logo={logo} className="size-20" ikonClassName="size-10" sizes="160px" />
              <span className="text-xs text-stone-500">Di atas latar terang</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-600">
              {logo ? `${logo.lebar} × ${logo.tinggi} piksel` : "Belum ada logo — situs memakai ikon masjid bawaan."}
            </p>
            {logo && <TombolHapusLogo />}
          </div>
        </Kartu>
        <Kartu
          judul="Unggah logo baru"
          deskripsi="Logo diperkecil otomatis (maks. 600 px) dan transparansinya dipertahankan. Logo persegi paling pas."
        >
          <FormLogo />
        </Kartu>
      </div>

      <h2 className="mb-3 text-lg font-bold text-hijau-900">Foto utama masjid</h2>
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
