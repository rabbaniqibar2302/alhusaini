"use client";

import Image from "next/image";
import { useState } from "react";
import { IkonPerbesar } from "@/components/ikon";
import { PenampilFoto, type ItemFoto } from "./penampil-foto";

/** Grid foto; klik/ketuk untuk memperbesar, geser untuk berpindah foto. */
export function GaleriFoto({
  items,
  kolom = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
}: {
  items: (ItemFoto & { tanggalTampil?: string })[];
  kolom?: string;
}) {
  const [indeks, setIndeks] = useState<number | null>(null);

  return (
    <>
      <ul className={`grid gap-3 ${kolom}`}>
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setIndeks(i)}
              className="group block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-stone-200/80 transition hover:shadow-md"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-hijau-50">
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  unoptimized={item.url.endsWith(".svg")}
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute right-2 bottom-2 rounded-full bg-black/45 p-1.5 text-white opacity-90">
                  <IkonPerbesar className="size-4" />
                </span>
              </span>
              {(item.keterangan || item.tanggalTampil) && (
                <span className="block p-3">
                  {item.keterangan && (
                    <span className="line-clamp-2 text-sm font-medium text-stone-800">{item.keterangan}</span>
                  )}
                  {item.tanggalTampil && <span className="mt-1 block text-xs text-stone-500">{item.tanggalTampil}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <PenampilFoto items={items} indeks={indeks} onTutup={() => setIndeks(null)} onGanti={setIndeks} />
    </>
  );
}

/** Satu foto (mis. bukti registrasi) yang bisa diperbesar. */
export function FotoDiperbesar({
  item,
  className = "",
  isi = "cover",
  ikutiRasio = false,
  sizes = "(min-width: 768px) 40vw, 90vw",
}: {
  item: ItemFoto;
  className?: string;
  /** "contain" untuk gambar yang tidak boleh terpotong (mis. QRIS, poster). */
  isi?: "cover" | "contain";
  /** Tinggi kotak mengikuti rasio gambar (bila wadah tidak menentukan tinggi). */
  ikutiRasio?: boolean;
  sizes?: string;
}) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className={`group relative block overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 ${className}`}
        style={ikutiRasio ? { aspectRatio: `${item.lebar} / ${item.tinggi}` } : undefined}
        aria-label={`Perbesar: ${item.alt}`}
      >
        <Image
          src={item.url}
          alt={item.alt}
          fill
          sizes={sizes}
          unoptimized={item.url.endsWith(".svg")}
          className={`transition duration-300 ${isi === "cover" ? "object-cover group-hover:scale-105" : "object-contain"}`}
        />
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
          <IkonPerbesar className="size-3.5" /> Perbesar
        </span>
      </button>
      <PenampilFoto items={[item]} indeks={buka ? 0 : null} onTutup={() => setBuka(false)} onGanti={() => {}} />
    </>
  );
}
