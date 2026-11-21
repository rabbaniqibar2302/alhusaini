import type { CSSProperties, ReactNode } from "react";
import { IkonBuku, IkonBulanSabit, IkonKalender, IkonMikrofon } from "@/components/ikon";
import { labelWaktuSegera, type ItemSegera, type JenisSegera } from "@/lib/segera";

const IKON: Record<JenisSegera, (p: { className?: string }) => ReactNode> = {
  sholatKhusus: IkonBulanSabit,
  agenda: IkonKalender,
  jumat: IkonMikrofon,
  kajian: IkonBuku,
};

/** Mulai jumlah ini pita bergerak; kurang dari itu cukup dideretkan. */
const MIN_BERJALAN = 4;

function Chip({ item, hariIni, salinan }: { item: ItemSegera; hariIni: string; salinan: boolean }) {
  const Ikon = IKON[item.jenis];
  return (
    <a
      href={`#${item.bagian}`}
      tabIndex={salinan ? -1 : undefined}
      className="group/chip flex items-center gap-3 rounded-2xl bg-white py-2 pr-4 pl-2 shadow-sm ring-1 ring-stone-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-aksen-300"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-utama-700 to-utama-950 text-aksen-300 transition group-hover/chip:scale-105">
        <Ikon className="size-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[0.7rem] font-bold tracking-wide whitespace-nowrap text-aksen-700 uppercase">
          {labelWaktuSegera(item, hariIni)}
        </span>
        <span className="block max-w-56 truncate text-sm font-semibold text-utama-900">{item.judul}</span>
        <span className="block max-w-56 truncate text-xs text-stone-500">{item.keterangan}</span>
      </span>
    </a>
  );
}

/**
 * Pita "Segera di masjid": jadwal terdekat yang bergulir pelan (berhenti saat
 * disentuh/disorot). Bila pengguna mengurangi gerakan, pita bisa digeser manual.
 */
export function PitaSegera({ items, hariIni }: { items: ItemSegera[]; hariIni: string }) {
  if (items.length === 0) return null;
  const berjalan = items.length >= MIN_BERJALAN;
  const daftar = berjalan ? [...items, ...items] : items;

  return (
    <section aria-labelledby="segera-judul" className="bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-12 sm:flex-row sm:items-center sm:gap-6 sm:pb-16">
        <h2
          id="segera-judul"
          className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-[0.18em] text-aksen-700 uppercase sm:w-28 sm:flex-col sm:items-start sm:gap-1"
        >
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-aksen-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-aksen-500" />
          </span>
          Segera di masjid
        </h2>
        <div
          className={`group -mx-4 min-w-0 flex-1 px-4 sm:mx-0 sm:px-0 ${
            berjalan
              ? "overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] motion-reduce:overflow-x-auto"
              : "overflow-x-auto [scrollbar-width:none]"
          }`}
        >
          <ul
            className={`flex w-max py-2 ${
              berjalan
                ? "teks-berjalan group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
                : ""
            }`}
            style={berjalan ? ({ animationDuration: `${items.length * 7}s` } as CSSProperties) : undefined}
          >
            {daftar.map((x, i) => {
              const salinan = i >= items.length;
              return (
                <li
                  key={`${x.kunci}-${salinan ? "b" : "a"}`}
                  aria-hidden={salinan || undefined}
                  className={`pr-3 ${salinan ? "motion-reduce:hidden" : ""}`}
                >
                  <Chip item={x} hariIni={hariIni} salinan={salinan} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
