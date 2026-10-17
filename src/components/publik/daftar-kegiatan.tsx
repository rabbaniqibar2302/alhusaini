"use client";

import Image from "next/image";
import { useState } from "react";
import { IkonFoto, IkonKalender, IkonPerbesar } from "@/components/ikon";
import { PenampilFoto, type ItemFoto } from "./penampil-foto";

export type KegiatanTampil = {
  id: string;
  judul: string;
  tanggalTampil: string;
  akanDatang: boolean;
  keterangan: string;
  foto: ItemFoto[];
};

function Sampul({ item, onBuka, besar }: { item: KegiatanTampil; onBuka: (i: number) => void; besar?: boolean }) {
  const sampul = item.foto[0];
  if (!sampul) {
    return (
      <div className="pola-islami grid aspect-[4/3] place-items-center bg-hijau-900 text-emas-300">
        <IkonKalender className="size-10" />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onBuka(0)}
      className="group relative block aspect-[4/3] w-full overflow-hidden bg-hijau-50"
      aria-label={`Lihat foto kegiatan: ${item.judul}`}
    >
      <Image
        src={sampul.url}
        alt={sampul.alt}
        fill
        sizes={besar ? "(min-width: 768px) 40vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        className="object-cover transition duration-300 group-hover:scale-105"
      />
      <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
        {item.foto.length > 1 ? (
          <>
            <IkonFoto className="size-3.5" /> {item.foto.length} foto
          </>
        ) : (
          <>
            <IkonPerbesar className="size-3.5" /> Perbesar
          </>
        )}
      </span>
    </button>
  );
}

function Tanggal({ item }: { item: KegiatanTampil }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-emas-700">
      <IkonKalender className="size-4" />
      {item.tanggalTampil}
      {item.akanDatang && (
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[0.7rem] font-semibold text-sky-800 ring-1 ring-sky-200">
          Akan datang
        </span>
      )}
    </p>
  );
}

/**
 * Daftar kegiatan masjid. Mode ringkas (halaman depan) berupa grid kartu;
 * mode lengkap (/kegiatan) menampilkan keterangan utuh dan semua foto.
 */
export function DaftarKegiatan({ items, lengkap = false }: { items: KegiatanTampil[]; lengkap?: boolean }) {
  const [buka, setBuka] = useState<{ kegiatan: number; foto: number } | null>(null);
  const fotoTerbuka = buka ? items[buka.kegiatan]?.foto ?? [] : [];

  return (
    <>
      {lengkap ? (
        <ul className="space-y-6">
          {items.map((item, k) => (
            <li key={item.id}>
              <article
                id={`kegiatan-${item.id}`}
                className="grid scroll-mt-32 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80 md:grid-cols-[2fr_3fr]"
              >
                <Sampul item={item} besar onBuka={(f) => setBuka({ kegiatan: k, foto: f })} />
                <div className="p-5">
                  <Tanggal item={item} />
                  <h2 className="mt-1.5 text-xl font-bold text-hijau-900">{item.judul}</h2>
                  {item.keterangan && (
                    <p className="mt-2 leading-relaxed whitespace-pre-line text-stone-700">{item.keterangan}</p>
                  )}
                  {item.foto.length > 1 && (
                    <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {item.foto.map((f, i) => (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => setBuka({ kegiatan: k, foto: i })}
                            className="relative block aspect-square w-full overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 transition hover:ring-hijau-400"
                            aria-label={`Foto ${i + 1} dari ${item.foto.length}: ${item.judul}`}
                          >
                            <Image src={f.url} alt="" fill sizes="96px" className="object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, k) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80">
                <Sampul item={item} onBuka={(f) => setBuka({ kegiatan: k, foto: f })} />
                <div className="flex-1 p-4">
                  <Tanggal item={item} />
                  <h3 className="mt-1.5 font-bold text-hijau-900">{item.judul}</h3>
                  {item.keterangan && (
                    <p className="mt-1.5 line-clamp-3 text-sm whitespace-pre-line text-stone-600">{item.keterangan}</p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      <PenampilFoto
        items={fotoTerbuka}
        indeks={buka ? buka.foto : null}
        onTutup={() => setBuka(null)}
        onGanti={(f) => setBuka((b) => (b ? { ...b, foto: f } : b))}
      />
    </>
  );
}
