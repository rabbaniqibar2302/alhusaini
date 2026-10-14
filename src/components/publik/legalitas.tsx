import { IkonDokumen, IkonPerisai } from "@/components/ikon";
import type { Legalitas } from "@/lib/schemas";
import { FotoDiperbesar } from "./galeri-foto";

const DOKUMEN = [
  {
    kunci: "kemenag",
    judul: "Kementerian Agama RI",
    keterangan: "Terdaftar dalam Sistem Informasi Masjid (SIMAS) Kemenag",
    labelNomor: "Nomor ID / registrasi masjid",
  },
  {
    kunci: "dmi",
    judul: "Dewan Masjid Indonesia (DMI)",
    keterangan: "Terdaftar sebagai anggota Dewan Masjid Indonesia",
    labelNomor: "Nomor registrasi DMI",
  },
] as const;

export function KartuLegalitas({ data }: { data: Legalitas }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DOKUMEN.map((d) => {
        const dok = data[d.kunci];
        return (
          <article
            key={d.kunci}
            className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:flex-row sm:p-5"
          >
            {dok.foto ? (
              <FotoDiperbesar
                item={{
                  id: d.kunci,
                  url: dok.foto.url,
                  lebar: dok.foto.lebar,
                  tinggi: dok.foto.tinggi,
                  alt: `Bukti registrasi ${d.judul}`,
                  keterangan: `Bukti registrasi ${d.judul}${dok.nomor ? ` — ${dok.nomor}` : ""}`,
                }}
                className="aspect-[4/3] w-full shrink-0 sm:w-44"
              />
            ) : (
              <div className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-center text-xs text-stone-500 sm:aspect-[4/3] sm:w-44 sm:flex-col sm:py-0">
                <IkonDokumen className="size-6 text-stone-400 sm:size-8" />
                Foto bukti belum diunggah
              </div>
            )}
            <div className="flex flex-col">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emas-600 uppercase">
                <IkonPerisai className="size-4" /> Terdaftar resmi
              </p>
              <h3 className="mt-1 text-lg font-bold text-hijau-900">{d.judul}</h3>
              <p className="text-sm text-stone-600">{d.keterangan}</p>
              <div className="mt-3 rounded-xl bg-hijau-50 px-3 py-2 ring-1 ring-hijau-100">
                <p className="text-xs text-stone-500">{d.labelNomor}</p>
                <p className="font-mono text-base font-semibold break-all text-hijau-900">
                  {dok.nomor || <span className="font-sans text-sm font-normal text-stone-500">Belum diisi</span>}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
