import Image from "next/image";
import { IkonBulanSabit, IkonJam, IkonPanah, IkonPin, IkonTautanLuar } from "@/components/ikon";
import { IlustrasiMasjid } from "@/components/ilustrasi-masjid";
import type { Foto, Identitas } from "@/lib/schemas";
import { urlMaps } from "@/lib/site";

/** Kabar terdekat di atas nama masjid, mis. jadwal sholat Ied. */
export type SorotanHero = { label: string; teks: string; href: string };

const KATA = ["beribadah", "menuntut ilmu", "berbagi kebaikan", "bersilaturahmi"];

/** Lengkung mihrab yang tergambar perlahan di belakang judul. */
function Mihrab({ className }: { className: string }) {
  const garis = "[stroke-dasharray:1] motion-safe:animate-gambar-garis";
  return (
    <svg viewBox="0 0 400 560" fill="none" className={className} aria-hidden="true">
      <path
        pathLength={1}
        d="M24 560V262C24 150 112 70 200 14c88 56 176 136 176 248v298"
        stroke="currentColor"
        strokeWidth={2}
        className={garis}
      />
      <path
        pathLength={1}
        d="M64 560V274C64 178 132 108 200 62c68 46 136 116 136 212v286"
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={0.55}
        className={`${garis} [animation-delay:0.6s]`}
      />
    </svg>
  );
}

export function Hero({
  foto,
  identitas,
  sorotan,
  tanggalHijriah,
}: {
  foto: Foto | null;
  identitas: Identitas;
  sorotan: SorotanHero | null;
  /** Mis. "12 Jumadil Akhir 1448 H", tampil bila tidak ada sorotan. */
  tanggalHijriah: string;
}) {
  const masuk = "motion-safe:animate-naik";
  return (
    <section id="beranda" className="relative isolate overflow-hidden bg-utama-950 text-white">
      <div className="absolute inset-0 -z-20 motion-safe:animate-kenburns">
        {foto ? (
          <Image src={foto.url} alt={`Foto ${identitas.nama}`} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <IlustrasiMasjid id="ilustrasi-hero" />
        )}
      </div>
      <div
        className="absolute inset-0 -z-10 bg-linear-to-t from-utama-950 via-utama-950/75 to-utama-950/15"
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-utama-950/60 to-transparent" aria-hidden="true" />
      <div className="latar-kisi absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-48 -right-40 -z-10 size-[38rem] rounded-full bg-radial from-aksen-400/30 via-aksen-400/5 to-transparent to-70% motion-safe:animate-melayang"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-56 -left-48 -z-10 size-[34rem] rounded-full bg-radial from-utama-400/35 to-transparent to-70% motion-safe:animate-melayang motion-safe:[animation-delay:-9s]"
        aria-hidden="true"
      />
      <Mihrab className="pointer-events-none absolute -right-28 bottom-0 -z-10 h-[86%] text-aksen-300/25 sm:right-[2%] lg:right-[7%] lg:text-aksen-300/40" />

      <div className="mx-auto flex min-h-[76svh] max-w-6xl flex-col justify-end px-4 pt-20 pb-16 sm:min-h-[600px] sm:pb-20">
        {sorotan ? (
          <a
            href={sorotan.href}
            className={`group mb-5 inline-flex max-w-full items-center gap-2 self-start rounded-full bg-white/10 py-1 pr-3 pl-1 text-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 ${masuk}`}
          >
            <span className="shrink-0 rounded-full bg-aksen-400 px-2.5 py-0.5 text-xs font-bold text-utama-950">
              {sorotan.label}
            </span>
            <span className="truncate">{sorotan.teks}</span>
            <IkonPanah className="size-4 shrink-0 transition group-hover:translate-x-0.5" />
          </a>
        ) : (
          tanggalHijriah && (
            <p
              className={`mb-5 inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur ${masuk}`}
            >
              <IkonBulanSabit className="size-4 text-aksen-300" /> {tanggalHijriah}
            </p>
          )
        )}
        {identitas.namaArab && (
          <p
            lang="ar"
            dir="rtl"
            className={`mb-2 self-start font-arab text-3xl text-aksen-300 sm:text-4xl ${masuk} [animation-delay:80ms]`}
          >
            {identitas.namaArab}
          </p>
        )}
        <h1 className={`text-4xl font-extrabold tracking-tight text-balance sm:text-6xl ${masuk} [animation-delay:160ms]`}>
          {identitas.nama}
        </h1>
        <p className={`mt-3 text-lg font-semibold text-utama-50 sm:text-2xl ${masuk} [animation-delay:240ms]`}>
          <span className="sr-only">Tempat kita untuk {KATA.slice(0, -1).join(", ")}, dan {KATA.at(-1)}.</span>
          <span aria-hidden="true">
            Tempat kita untuk{" "}
            <span className="inline-grid align-bottom">
              {KATA.map((k, i) => (
                <span
                  key={k}
                  className="col-start-1 row-start-1 bg-linear-to-r from-aksen-200 to-aksen-400 bg-clip-text whitespace-nowrap text-transparent motion-safe:animate-kata motion-reduce:not-first:invisible"
                  style={{ animationDelay: `${i * 3}s` }}
                >
                  {k}
                </span>
              ))}
            </span>
          </span>
        </p>
        <p
          className={`mt-4 flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-utama-50/90 sm:text-base ${masuk} [animation-delay:320ms]`}
        >
          <IkonPin className="mt-0.5 size-5 shrink-0 text-aksen-300" />
          <span>{identitas.alamat}</span>
        </p>
        <div className={`mt-7 flex flex-wrap gap-3 ${masuk} [animation-delay:400ms]`}>
          <a
            href="#jadwal-sholat"
            className="kilau inline-flex items-center gap-2 rounded-full bg-aksen-400 px-5 py-3 font-semibold text-utama-950 shadow-lg shadow-aksen-500/30 transition hover:-translate-y-0.5 hover:bg-aksen-300 hover:shadow-aksen-400/40"
          >
            <IkonJam className="size-5" /> Jadwal Sholat
          </a>
          <a
            href={urlMaps(identitas)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            <IkonTautanLuar className="size-5" /> Petunjuk Arah
          </a>
        </div>
      </div>
    </section>
  );
}
