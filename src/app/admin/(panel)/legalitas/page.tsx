import type { Metadata } from "next";
import Image from "next/image";
import { FormLegalitas, TombolHapusFotoLegalitas } from "@/components/admin/form-foto";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { IkonDokumen } from "@/components/ikon";
import { JENIS_LEGALITAS } from "@/lib/schemas";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Legalitas" };
export const instant = false;

const INFO = {
  kemenag: { judul: "Registrasi Kementerian Agama (SIMAS)", labelNomor: "Nomor ID / registrasi masjid Kemenag" },
  dmi: { judul: "Registrasi Dewan Masjid Indonesia (DMI)", labelNomor: "Nomor registrasi DMI" },
} as const;

export default async function HalamanLegalitas() {
  await wajibAdminHalaman();
  const legalitas = await bacaKonten("legalitas");

  return (
    <>
      <JudulHalaman
        judul="Legalitas Masjid"
        deskripsi="Nomor registrasi dan foto bukti pendaftaran yang tampil di bagian Legalitas halaman depan."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {JENIS_LEGALITAS.map((jenis) => {
          const dok = legalitas[jenis];
          return (
            <Kartu key={jenis} judul={INFO[jenis].judul}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 sm:w-48">
                  {dok.foto ? (
                    <Image
                      src={dok.foto.url}
                      alt={`Bukti ${INFO[jenis].judul}`}
                      fill
                      sizes="(min-width: 640px) 12rem, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-center text-xs text-stone-500">
                      <IkonDokumen className="mx-auto mb-1 size-8 text-stone-400" />
                      Belum ada foto
                    </span>
                  )}
                </div>
                {dok.foto && <TombolHapusFotoLegalitas jenis={jenis} />}
              </div>
              <FormLegalitas jenis={jenis} nomor={dok.nomor} labelNomor={INFO[jenis].labelNomor} />
            </Kartu>
          );
        })}
      </div>
    </>
  );
}
