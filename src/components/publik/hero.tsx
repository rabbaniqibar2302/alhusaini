import Image from "next/image";
import { IkonJam, IkonPin, IkonTautanLuar } from "@/components/ikon";
import type { Foto, Identitas } from "@/lib/schemas";
import { urlMaps } from "@/lib/site";

export function Hero({ foto, identitas }: { foto: Foto | null; identitas: Identitas }) {
  return (
    <section id="beranda" className="relative isolate overflow-hidden bg-hijau-950 text-white">
      {foto ? (
        <Image
          src={foto.url}
          alt={`Foto ${identitas.nama}`}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
      ) : (
        <Image
          src="/images/masjid-ilustrasi.svg"
          alt=""
          fill
          priority
          unoptimized
          className="-z-20 object-cover object-bottom"
        />
      )}
      <div
        className="absolute inset-0 -z-10 bg-linear-to-t from-hijau-950 via-hijau-950/70 to-hijau-950/10"
        aria-hidden="true"
      />

      <div className="mx-auto flex min-h-[72svh] max-w-6xl flex-col justify-end px-4 pt-20 pb-10 sm:min-h-[560px] sm:pb-14">
        {identitas.namaArab && (
          <p lang="ar" dir="rtl" className="mb-2 self-start font-arab text-3xl text-emas-300 sm:text-4xl">
            {identitas.namaArab}
          </p>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">{identitas.nama}</h1>
        <p className="mt-4 flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-hijau-50 sm:text-base">
          <IkonPin className="mt-0.5 size-5 shrink-0 text-emas-300" />
          <span>{identitas.alamat}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#jadwal-sholat"
            className="inline-flex items-center gap-2 rounded-full bg-emas-400 px-5 py-2.5 font-semibold text-hijau-950 shadow-lg shadow-black/20 transition hover:bg-emas-300"
          >
            <IkonJam className="size-5" /> Jadwal Sholat
          </a>
          <a
            href={urlMaps(identitas)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
          >
            <IkonTautanLuar className="size-5" /> Petunjuk Arah
          </a>
        </div>
      </div>
    </section>
  );
}
