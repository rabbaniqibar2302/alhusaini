import Image from "next/image";
import { IkonJam, IkonKalender, IkonPin } from "@/components/ikon";
import { hitungMundurAgenda, labelTanggalAgenda } from "@/lib/agenda";
import { posterAgenda, tautanPoster, type KonteksPoster } from "@/lib/poster";
import type { AgendaItem } from "@/lib/schemas";
import { NAMA_BULAN } from "@/lib/time";
import { FotoDiperbesar } from "./galeri-foto";
import { TombolPoster } from "./tombol-poster";

const BATAS_RINGKAS = 180;

function TanpaPoster({ tanggal }: { tanggal: string }) {
  const [, bulan, tgl] = tanggal.split("-").map(Number);
  return (
    <div className="pola-islami grid size-full place-items-center bg-linear-to-b from-hijau-700 to-hijau-950 text-center text-white">
      <div>
        <IkonKalender className="mx-auto size-8 text-emas-300" />
        <p className="mt-2 text-5xl leading-none font-extrabold">{tgl}</p>
        <p className="mt-1 text-sm font-semibold tracking-[0.2em] text-emas-200 uppercase">{NAMA_BULAN[bulan - 1]}</p>
      </div>
    </div>
  );
}

function KartuAgenda({ item, hariIni, poster }: { item: AgendaItem; hariIni: string; poster: KonteksPoster }) {
  const mundur = hitungMundurAgenda(item, hariIni);
  const dekat = item.tanggal <= hariIni || mundur === "Besok";
  const panjang = item.keterangan.length > BATAS_RINGKAS;
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ${
        dekat ? "ring-2 ring-emas-400" : "ring-stone-200/80"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-hijau-950">
        {item.poster ? (
          <>
            {/* Latar buram dari poster yang sama, supaya poster utuh tidak dikelilingi ruang kosong. */}
            <Image src={item.poster.url} alt="" fill sizes="64px" className="scale-125 object-cover opacity-70 blur-2xl" />
            <FotoDiperbesar
              item={{ id: item.id, url: item.poster.url, lebar: item.poster.lebar, tinggi: item.poster.tinggi, alt: `Poster ${item.judul}`, keterangan: item.judul }}
              isi="contain"
              className="size-full rounded-none! bg-transparent! ring-0!"
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
            />
          </>
        ) : (
          <TanpaPoster tanggal={item.tanggal} />
        )}
        <p
          className={`pointer-events-none absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold shadow ${
            dekat ? "bg-emas-400 text-hijau-950" : "bg-white/95 text-hijau-900"
          }`}
        >
          {mundur}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg leading-snug font-bold text-hijau-900">{item.judul}</h3>
        <ul className="mt-2 space-y-1 text-sm text-stone-600">
          <li className="flex items-center gap-2">
            <IkonKalender className="size-4 shrink-0 text-emas-600" />
            {labelTanggalAgenda(item)}
          </li>
          {item.jam && (
            <li className="flex items-center gap-2">
              <IkonJam className="size-4 shrink-0 text-emas-600" />
              Pukul {item.jam} WIB
            </li>
          )}
          {item.lokasi && (
            <li className="flex items-start gap-2">
              <IkonPin className="mt-0.5 size-4 shrink-0 text-emas-600" />
              {item.lokasi}
            </li>
          )}
        </ul>
        {item.keterangan &&
          (panjang ? (
            <details className="group mt-3 text-sm text-stone-700">
              <summary className="cursor-pointer list-none">
                <span className="line-clamp-3 whitespace-pre-line group-open:hidden">{item.keterangan}</span>
                <span className="mt-1 inline-block font-semibold text-hijau-800 group-open:hidden">Baca selengkapnya</span>
                <span className="hidden font-semibold text-hijau-800 group-open:inline">Tutup</span>
              </summary>
              <p className="mt-1 whitespace-pre-line">{item.keterangan}</p>
            </details>
          ) : (
            <p className="mt-3 text-sm whitespace-pre-line text-stone-700">{item.keterangan}</p>
          ))}
        {!item.contoh && (
          <div className="mt-auto pt-4">
            <TombolPoster poster={tautanPoster(posterAgenda(item, poster))} />
          </div>
        )}
      </div>
    </article>
  );
}

export function DaftarAgenda({
  items,
  hariIni,
  poster,
}: {
  items: AgendaItem[];
  hariIni: string;
  poster: KonteksPoster;
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((x) => (
        <li key={x.id}>
          <KartuAgenda item={x} hariIni={hariIni} poster={poster} />
        </li>
      ))}
    </ul>
  );
}
