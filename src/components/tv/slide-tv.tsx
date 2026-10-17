import Image from "next/image";
import type { ReactNode } from "react";
import { IkonBulanSabit, IkonBuku, IkonMikrofon, IkonPengumuman } from "@/components/ikon";
import { INFO_KAJIAN, type KejadianKajian } from "@/lib/kajian";
import type { KhotibItem } from "@/lib/schemas";
import { SITE } from "@/lib/site";
import { formatTanggal, namaHari, selisihHari, tambahHari } from "@/lib/time";

export type GambarTv = { url: string; lebar: number; tinggi: number };

export type HariBesarTv = { kunci: string; judul: string; label: string; ucapan: string; tanggal: string; tahunHijriah: number };

export type SlideTv =
  | { jenis: "foto"; kunci: string; foto: GambarTv | null }
  | { jenis: "pengumuman"; kunci: string; items: { id: string; teks: string }[]; halaman: string }
  | { jenis: "kajian"; kunci: string; items: KejadianKajian[]; halaman: string }
  | { jenis: "khotib"; kunci: string; items: KhotibItem[] }
  | { jenis: "hari-besar"; kunci: string; acara: HariBesarTv[] }
  | { jenis: "kegiatan"; kunci: string; judul: string; tanggal: string; foto: GambarTv };

function Judul({ ikon, teks, sub }: { ikon: ReactNode; teks: string; sub?: string }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-white/15 pb-5">
      <h2 className="flex items-center gap-4 text-[3rem] leading-none font-extrabold">
        <span className="grid size-[4.2rem] place-items-center rounded-2xl bg-emas-400 text-hijau-950">{ikon}</span>
        {teks}
      </h2>
      {sub && <p className="text-[1.6rem] text-hijau-100">{sub}</p>}
    </div>
  );
}

function labelHari(tanggal: string, hariIni: string): string {
  if (tanggal === hariIni) return "Hari ini";
  if (tanggal === tambahHari(hariIni, 1)) return "Besok";
  return namaHari(tanggal);
}

function GambarPenuh({ foto, alt, prioritas }: { foto: GambarTv | null; alt: string; prioritas?: boolean }) {
  return foto ? (
    <Image src={foto.url} alt={alt} fill sizes="70vw" priority={prioritas} className="object-cover" />
  ) : (
    <Image
      src="/images/masjid-ilustrasi.svg"
      alt=""
      fill
      unoptimized
      priority={prioritas}
      className="object-cover object-bottom"
    />
  );
}

export function IsiSlide({ slide, hariIni }: { slide: SlideTv; hariIni: string }) {
  switch (slide.jenis) {
    case "foto":
      return (
        <>
          <GambarPenuh foto={slide.foto} alt={`Foto ${SITE.nama}`} prioritas />
          <div className="absolute inset-0 bg-linear-to-t from-hijau-950/90 via-hijau-950/20 to-transparent" />
          <div className="absolute right-10 bottom-9 max-w-[46rem] text-right">
            <p className="text-[2rem] text-hijau-50">Selamat datang di</p>
            <p className="text-[4.4rem] leading-tight font-extrabold">{SITE.nama}</p>
            <p lang="ar" dir="rtl" className="mt-1 font-arab text-[2.6rem] text-emas-300">
              {SITE.namaArab}
            </p>
          </div>
        </>
      );

    case "kegiatan":
      return (
        <>
          <GambarPenuh foto={slide.foto} alt={slide.judul} />
          <div className="absolute inset-0 bg-linear-to-t from-hijau-950/95 via-hijau-950/30 to-transparent" />
          <div className="absolute right-10 bottom-9 max-w-[48rem] text-right">
            <p className="text-[1.6rem] font-semibold tracking-[0.2em] text-emas-300 uppercase">Kegiatan Masjid</p>
            <p className="mt-1 line-clamp-2 text-[3.4rem] leading-tight font-extrabold">{slide.judul}</p>
            <p className="mt-2 text-[1.8rem] text-hijau-50">{formatTanggal(slide.tanggal, { hari: true })}</p>
          </div>
        </>
      );

    case "pengumuman":
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 p-12">
          <Judul ikon={<IkonPengumuman className="size-[2.4rem]" />} teks="Pengumuman" sub={slide.halaman} />
          <ul className="mt-8 flex flex-1 flex-col justify-center gap-8">
            {slide.items.map((x) => (
              <li key={x.id} className="flex gap-6 text-[2.7rem] leading-snug font-semibold">
                <span className="mt-[1.1rem] size-[1.2rem] shrink-0 rotate-45 rounded-sm bg-emas-400" />
                <span className="min-w-0 break-words">{x.teks}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "kajian":
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 p-12">
          <Judul ikon={<IkonBuku className="size-[2.4rem]" />} teks="Jadwal Kajian" sub={slide.halaman} />
          <ul className="mt-6 flex flex-1 flex-col justify-center divide-y divide-white/10">
            {slide.items.map((k) => (
              <li key={k.kunci} className="flex items-center gap-7 py-[1.1rem]">
                <div
                  className={`w-[10.5rem] shrink-0 rounded-2xl px-3 py-2.5 text-center ${
                    k.tanggal === hariIni ? "bg-emas-400 text-hijau-950" : "bg-white/10"
                  }`}
                >
                  <p className="text-[1.5rem] leading-tight font-semibold">{labelHari(k.tanggal, hariIni)}</p>
                  <p className="text-[1.9rem] leading-tight font-extrabold">{formatTanggal(k.tanggal, { singkat: true }).replace(/ \d{4}$/, "")}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.3rem] font-semibold tracking-wider text-emas-300 uppercase">
                    {INFO_KAJIAN[k.jenis].singkat}
                    {k.rutin && <span className="ml-3 text-hijau-100 normal-case">· rutin pekanan</span>}
                  </p>
                  <p className="truncate text-[2.3rem] leading-tight font-bold">{k.materi}</p>
                  <p className="truncate text-[1.75rem] text-hijau-50">{k.ustadz}</p>
                </div>
                <p className="shrink-0 text-right text-[2.3rem] font-bold tabular-nums">
                  {k.jam || (k.jenis === "kuliahSubuh" ? <span className="text-[1.7rem]">Ba&apos;da Subuh</span> : "")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      );

    case "khotib": {
      const [utama, berikut] = slide.items;
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 p-12">
          <Judul
            ikon={<IkonMikrofon className="size-[2.4rem]" />}
            teks="Khotib Jumat"
            sub={utama.tanggal === hariIni ? "Hari ini" : formatTanggal(utama.tanggal, { hari: true })}
          />
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-[1.8rem] text-hijau-100">Khotib</p>
            <p className="text-[4.6rem] leading-tight font-extrabold">{utama.khotib}</p>
            {utama.imam && (
              <p className="mt-4 text-[2.2rem]">
                <span className="text-hijau-100">Imam: </span>
                <span className="font-semibold">{utama.imam}</span>
              </p>
            )}
            {utama.tema && (
              <p className="mt-6 border-l-4 border-emas-400 pl-6 text-[2.5rem] leading-snug text-emas-100 italic">
                “{utama.tema}”
              </p>
            )}
          </div>
          {berikut && (
            <p className="rounded-2xl bg-white/10 px-6 py-4 text-[1.7rem] text-hijau-50">
              Jumat berikutnya, {formatTanggal(berikut.tanggal)}:{" "}
              <span className="font-semibold text-white">{berikut.khotib}</span>
            </p>
          )}
        </div>
      );
    }

    case "hari-besar":
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 p-12">
          <Judul ikon={<IkonBulanSabit className="size-[2.4rem]" />} teks="Menyambut Hari Besar Islam" />
          <div className="grid flex-1 grid-cols-3 items-center gap-6 pt-8">
            {slide.acara.map((a) => {
              const sisa = selisihHari(hariIni, a.tanggal);
              return (
                <div key={a.kunci} className="rounded-[1.75rem] bg-white/10 px-6 py-8 text-center ring-1 ring-white/15">
                  <p className="text-[1.5rem] font-semibold tracking-wider text-emas-300 uppercase">
                    {a.label} {a.tahunHijriah} H
                  </p>
                  <p className="mt-1 text-[2.1rem] leading-tight font-bold">{a.judul}</p>
                  {sisa <= 0 ? (
                    <p className="my-6 font-arab text-[3rem] leading-tight text-emas-300">{a.ucapan}</p>
                  ) : (
                    <p className="my-4">
                      <span className="block text-[6.5rem] leading-none font-extrabold tabular-nums">{sisa}</span>
                      <span className="text-[1.8rem] text-hijau-100">hari lagi</span>
                    </p>
                  )}
                  <p className="text-[1.6rem] text-hijau-50">{formatTanggal(a.tanggal, { hari: true })}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
  }
}
