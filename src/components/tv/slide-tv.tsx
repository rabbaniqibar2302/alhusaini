import Image from "next/image";
import type { ReactNode } from "react";
import {
  IkonBulanSabit,
  IkonBuku,
  IkonDompet,
  IkonGrafik,
  IkonJam,
  IkonKalender,
  IkonMikrofon,
  IkonPengumuman,
  IkonPin,
  IkonQr,
} from "@/components/ikon";
import { PanggungPenceramah } from "@/components/kartu-penceramah";
import { hitungMundurAgenda, labelTanggalAgenda } from "@/lib/agenda";
import { INFO_KAJIAN, type KejadianKajian } from "@/lib/kajian";
import { formatRupiah } from "@/lib/kas";
import type { FotoPenceramah } from "@/lib/penceramah";
import type { JenisTransaksi, KhotibItem, Rekening } from "@/lib/schemas";
import { NAMA_BULAN, formatTanggal, namaHari, selisihHari, tambahHari } from "@/lib/time";

export type GambarTv = { url: string; lebar: number; tinggi: number };

export type AgendaTv = {
  id: string;
  judul: string;
  tanggal: string;
  tanggalSelesai: string;
  jam: string;
  lokasi: string;
  poster: GambarTv | null;
};

export type KasTv = {
  periodeLabel: string;
  saldoAkhir: number;
  masuk: number;
  keluar: number;
  terakhir: string | null;
  transaksi: { id: string; tanggal: string; keterangan: string; jenis: JenisTransaksi; jumlah: number }[];
};

export type InfakTv = { qris: GambarTv | null; namaQris: string; rekening: Rekening[]; catatan: string };

export type HariBesarTv = { kunci: string; judul: string; label: string; ucapan: string; tanggal: string; tahunHijriah: number };

export type SlideTv =
  | { jenis: "foto"; kunci: string; foto: GambarTv | null; nama: string; namaArab: string }
  | { jenis: "pengumuman"; kunci: string; items: { id: string; teks: string }[]; halaman: string }
  | { jenis: "kajian"; kunci: string; items: (KejadianKajian & { foto: FotoPenceramah | null })[]; halaman: string }
  | { jenis: "khotib"; kunci: string; items: (KhotibItem & { foto: FotoPenceramah | null })[] }
  | { jenis: "hari-besar"; kunci: string; acara: HariBesarTv[] }
  | { jenis: "kegiatan"; kunci: string; judul: string; tanggal: string; foto: GambarTv }
  | { jenis: "agenda"; kunci: string; item: AgendaTv; halaman: string }
  | { jenis: "kas"; kunci: string; kas: KasTv }
  | { jenis: "infak"; kunci: string; infak: InfakTv };

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

/** Ubin tanggal di pojok kartu penceramah (ukuran layar TV). */
function UbinTanggalTv({ tanggal, hariIni }: { tanggal: string; hariIni: string }) {
  const sorot = tanggal === hariIni;
  const [, bulan, tgl] = tanggal.split("-").map(Number);
  return (
    <div
      className={`min-w-[6.4rem] rounded-[1.1rem] px-3 py-2 text-center shadow-lg ${
        sorot ? "bg-emas-400 text-hijau-950" : "bg-white text-hijau-900"
      }`}
    >
      <p className={`text-[1.15rem] leading-tight font-bold tracking-wider uppercase ${sorot ? "" : "text-emas-600"}`}>
        {labelHari(tanggal, hariIni)}
      </p>
      <p className="text-[3rem] leading-none font-extrabold tabular-nums">{tgl}</p>
      <p className="text-[1.2rem] leading-tight font-semibold">{NAMA_BULAN[bulan - 1].slice(0, 3)}</p>
    </div>
  );
}

function KartuKajianTv({ k, hariIni }: { k: KejadianKajian & { foto: FotoPenceramah | null }; hariIni: string }) {
  const jam = k.jam || (k.jenis === "kuliahSubuh" ? "Ba'da Subuh" : "");
  return (
    <article
      className={`flex h-full w-[calc((100%-5rem)/3)] shrink-0 flex-col overflow-hidden rounded-[2rem] bg-hijau-950 ring-2 ${
        k.tanggal === hariIni ? "ring-emas-400" : "ring-white/10"
      }`}
    >
      <PanggungPenceramah
        foto={k.foto}
        nama={k.ustadz}
        sizes="600px"
        kelasInisial="w-[36%]! text-[3.8rem]"
        diKartu
        className="min-h-0 flex-1"
      >
        <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
          <p className="min-w-0 truncate rounded-full bg-hijau-950/55 px-4 py-1.5 text-[1.2rem] font-semibold tracking-wider text-white uppercase ring-1 ring-white/15">
            {INFO_KAJIAN[k.jenis].singkat}
          </p>
          <UbinTanggalTv tanggal={k.tanggal} hariIni={hariIni} />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-hijau-950 via-hijau-950/85 to-transparent px-6 pt-20 pb-4">
          <p className="text-[1.15rem] font-semibold tracking-[0.2em] text-emas-300 uppercase">
            Pemateri{k.rutin && <span className="text-hijau-100"> · Rutin</span>}
          </p>
          <p
            className={`line-clamp-2 leading-tight font-extrabold text-balance ${
              k.ustadz.length > 26 ? "text-[1.95rem]" : "text-[2.3rem]"
            }`}
          >
            {k.ustadz}
          </p>
        </div>
      </PanggungPenceramah>
      <div className="px-6 pt-2 pb-5">
        <p className="flex items-start gap-3 text-[1.6rem] leading-snug text-hijau-50">
          <IkonBuku className="mt-[0.3rem] size-[1.7rem] shrink-0 text-emas-300/80" />
          <span className="line-clamp-2">{k.materi}</span>
        </p>
        {jam && (
          <p className="mt-3 flex items-center gap-3 text-[1.9rem] font-bold text-emas-300 tabular-nums">
            <IkonJam className="size-[1.8rem] shrink-0" />
            {jam}
          </p>
        )}
      </div>
    </article>
  );
}

export function IsiSlide({ slide, hariIni }: { slide: SlideTv; hariIni: string }) {
  switch (slide.jenis) {
    case "foto":
      return (
        <>
          <GambarPenuh foto={slide.foto} alt={`Foto ${slide.nama}`} prioritas />
          <div className="absolute inset-0 bg-linear-to-t from-hijau-950/90 via-hijau-950/20 to-transparent" />
          <div className="absolute right-10 bottom-12 max-w-[46rem] text-right">
            <p className="text-[2rem] text-hijau-50">Selamat datang di</p>
            <p className="text-[4.4rem] leading-tight font-extrabold text-balance">{slide.nama}</p>
            {slide.namaArab && (
              <p lang="ar" dir="rtl" className="mt-1 font-arab text-[2.6rem] text-emas-300">
                {slide.namaArab}
              </p>
            )}
          </div>
        </>
      );

    case "kegiatan":
      return (
        <>
          <GambarPenuh foto={slide.foto} alt={slide.judul} />
          <div className="absolute inset-0 bg-linear-to-t from-hijau-950/95 via-hijau-950/30 to-transparent" />
          <div className="absolute right-10 bottom-12 max-w-[48rem] text-right">
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
        <div className="pola-islami flex h-full flex-col bg-hijau-900 px-12 pt-10 pb-14">
          <Judul ikon={<IkonBuku className="size-[2.4rem]" />} teks="Jadwal Kajian" sub={slide.halaman} />
          <div className="mt-7 flex min-h-0 flex-1 justify-center gap-10">
            {slide.items.map((k) => (
              <KartuKajianTv key={k.kunci} k={k} hariIni={hariIni} />
            ))}
          </div>
        </div>
      );

    case "khotib": {
      const [utama, berikut] = slide.items;
      return (
        <div className="flex h-full bg-hijau-900">
          <PanggungPenceramah
            foto={utama.foto}
            nama={utama.khotib}
            sizes="700px"
            kelasInisial="text-[7rem]"
            className="h-full w-[36%] shrink-0"
          >
            <p className="absolute top-8 left-8 flex items-center gap-3 rounded-full bg-hijau-950/55 px-5 py-2 text-[1.4rem] font-semibold tracking-wider text-white uppercase ring-1 ring-white/15">
              <IkonMikrofon className="size-[1.6rem] text-emas-300" /> Khotib Jumat
            </p>
          </PanggungPenceramah>
          <div className="pola-islami flex min-w-0 flex-1 flex-col p-12">
            <Judul
              ikon={<IkonMikrofon className="size-[2.4rem]" />}
              teks="Sholat Jumat"
              sub={utama.tanggal === hariIni ? "Hari ini" : formatTanggal(utama.tanggal, { hari: true })}
            />
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <p className="text-[1.6rem] font-semibold tracking-[0.2em] text-emas-300 uppercase">Khotib</p>
              <p className="line-clamp-2 text-[4.2rem] leading-tight font-extrabold text-balance">{utama.khotib}</p>
              {utama.imam && (
                <p className="mt-4 text-[2.1rem]">
                  <span className="text-hijau-100">Imam: </span>
                  <span className="font-semibold">{utama.imam}</span>
                </p>
              )}
              {utama.tema && (
                <p className="mt-6 line-clamp-3 border-l-4 border-emas-400 pl-6 text-[2.4rem] leading-snug text-emas-100 italic">
                  “{utama.tema}”
                </p>
              )}
            </div>
            {berikut && (
              <div className="flex items-center gap-5 rounded-[1.4rem] bg-white/10 p-3 pr-6 text-[1.7rem] text-hijau-50">
                <PanggungPenceramah
                  foto={berikut.foto}
                  nama={berikut.khotib}
                  sizes="120px"
                  kelasInisial="text-[1.4rem]"
                  className="size-[4.6rem] shrink-0 rounded-full"
                />
                <p className="min-w-0">
                  Jumat berikutnya, {formatTanggal(berikut.tanggal)}
                  <span className="block truncate font-semibold text-white">{berikut.khotib}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    case "agenda": {
      const a = slide.item;
      const mundur = hitungMundurAgenda(a, hariIni);
      const [, bulan, tgl] = a.tanggal.split("-").map(Number);
      return (
        <div className="flex h-full bg-hijau-900">
          <div className="relative h-full w-[40%] shrink-0 overflow-hidden bg-hijau-950">
            {a.poster ? (
              <>
                <Image src={a.poster.url} alt="" fill sizes="96px" className="scale-125 object-cover opacity-60 blur-2xl" />
                <Image src={a.poster.url} alt={`Poster ${a.judul}`} fill sizes="800px" className="object-contain p-6" />
              </>
            ) : (
              <div className="pola-islami grid size-full place-items-center bg-linear-to-b from-hijau-700 to-hijau-950 text-center">
                <div>
                  <IkonKalender className="mx-auto size-[5rem] text-emas-300" />
                  <p className="mt-3 text-[9rem] leading-none font-extrabold">{tgl}</p>
                  <p className="text-[2.4rem] font-semibold tracking-[0.2em] text-emas-200 uppercase">{NAMA_BULAN[bulan - 1]}</p>
                </div>
              </div>
            )}
          </div>
          <div className="pola-islami flex min-w-0 flex-1 flex-col p-12">
            <Judul ikon={<IkonKalender className="size-[2.4rem]" />} teks="Agenda Mendatang" sub={slide.halaman} />
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <p
                className={`w-fit rounded-full px-6 py-2 text-[1.9rem] font-bold ${
                  mundur === "Hari ini" || mundur === "Besok" || mundur === "Sedang berlangsung"
                    ? "bg-emas-400 text-hijau-950"
                    : "bg-white/10 text-emas-200 ring-1 ring-white/15"
                }`}
              >
                {mundur}
              </p>
              <p className="mt-5 line-clamp-3 text-[4rem] leading-tight font-extrabold text-balance">{a.judul}</p>
              <ul className="mt-6 space-y-3 text-[2.1rem] text-hijau-50">
                <li className="flex items-center gap-4">
                  <IkonKalender className="size-[2.2rem] shrink-0 text-emas-300" />
                  {labelTanggalAgenda(a)}
                </li>
                {a.jam && (
                  <li className="flex items-center gap-4">
                    <IkonJam className="size-[2.2rem] shrink-0 text-emas-300" />
                    Pukul {a.jam} WIB
                  </li>
                )}
                {a.lokasi && (
                  <li className="flex items-center gap-4">
                    <IkonPin className="size-[2.2rem] shrink-0 text-emas-300" />
                    <span className="truncate">{a.lokasi}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    case "kas": {
      const k = slide.kas;
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 px-12 pt-10 pb-14">
          <Judul ikon={<IkonGrafik className="size-[2.4rem]" />} teks="Laporan Kas Masjid" sub={k.periodeLabel} />
          <div className="mt-8 grid min-h-0 flex-1 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-8">
            <div className="flex flex-col justify-center rounded-[2rem] bg-white/10 p-9 ring-1 ring-white/15">
              <p className="text-[1.6rem] font-semibold tracking-[0.2em] text-emas-300 uppercase">Saldo kas</p>
              <p
                className="mt-2 leading-tight font-extrabold whitespace-nowrap tabular-nums"
                // Angka panjang (miliaran) diperkecil supaya tetap satu baris.
                style={{ fontSize: `${Math.min(3.6, 23 / (formatRupiah(k.saldoAkhir).length * 0.6)).toFixed(2)}rem` }}
              >
                {formatRupiah(k.saldoAkhir)}
              </p>
              {k.terakhir && <p className="text-[1.6rem] text-hijau-100">per {formatTanggal(k.terakhir, { hari: true })}</p>}
              <dl className="mt-7 space-y-4 border-t border-white/15 pt-6">
                <div>
                  <dt className="text-[1.45rem] text-hijau-100">Pemasukan periode ini</dt>
                  <dd className="text-[2.3rem] leading-tight font-bold whitespace-nowrap text-emerald-300 tabular-nums">
                    +{formatRupiah(k.masuk)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[1.45rem] text-hijau-100">Pengeluaran periode ini</dt>
                  <dd className="text-[2.3rem] leading-tight font-bold whitespace-nowrap text-red-300 tabular-nums">
                    −{formatRupiah(k.keluar)}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex min-h-0 flex-col">
              <p className="text-[1.6rem] font-semibold tracking-[0.2em] text-emas-300 uppercase">Transaksi terakhir</p>
              {k.transaksi.length === 0 ? (
                <p className="mt-4 text-[1.9rem] text-hijau-100">Belum ada transaksi di periode ini.</p>
              ) : (
                <ul className="mt-3 flex flex-1 flex-col justify-around divide-y divide-white/10">
                  {k.transaksi.map((t) => (
                    <li key={t.id} className="flex items-center gap-5 py-2">
                      <span className="w-[6.5rem] shrink-0 text-[1.5rem] text-hijau-100">
                        {formatTanggal(t.tanggal, { singkat: true }).replace(/ \d{4}$/, "")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[1.75rem]">{t.keterangan}</span>
                      <span
                        className={`shrink-0 text-[1.9rem] font-bold tabular-nums ${
                          t.jenis === "masuk" ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {t.jenis === "masuk" ? "+" : "−"}
                        {formatRupiah(t.jumlah)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      );
    }

    case "infak": {
      const { qris, rekening, namaQris, catatan } = slide.infak;
      const padat = rekening.length > 3;
      return (
        <div className="pola-islami flex h-full flex-col bg-hijau-900 px-12 pt-10 pb-14">
          <Judul ikon={<IkonDompet className="size-[2.4rem]" />} teks="Infak & Sedekah" sub="Semoga Allah membalas dengan kebaikan" />
          <div className="mt-8 flex min-h-0 flex-1 gap-10">
            {qris && (
              <div className="flex shrink-0 flex-col items-center self-center rounded-[2rem] bg-white p-5 text-hijau-950">
                <p className="flex items-center gap-3 text-[1.7rem] font-extrabold tracking-wider uppercase">
                  <IkonQr className="size-[2rem] text-emas-600" /> Scan QRIS
                </p>
                <div
                  className="relative mt-3 h-[22rem] max-w-[30rem]"
                  style={{ aspectRatio: `${qris.lebar} / ${qris.tinggi}` }}
                >
                  <Image src={qris.url} alt="QRIS infak" fill sizes="700px" className="object-contain" />
                </div>
                {namaQris && <p className="mt-2 max-w-[24rem] truncate text-[1.5rem] font-semibold">{namaQris}</p>}
              </div>
            )}
            {(rekening.length > 0 || catatan) && (
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
                {rekening.slice(0, 5).map((r) => (
                  <div key={r.id} className={`rounded-[1.6rem] bg-white/10 ring-1 ring-white/15 ${padat ? "px-7 py-3" : "px-8 py-5"}`}>
                    <p className="text-[1.5rem] font-bold tracking-wider text-emas-300 uppercase">{r.bank}</p>
                    <p className={`leading-tight font-extrabold tracking-wide tabular-nums ${padat ? "text-[2.6rem]" : "text-[3.3rem]"}`}>
                      {r.nomor}
                    </p>
                    <p className={`truncate text-hijau-50 ${padat ? "text-[1.5rem]" : "text-[1.8rem]"}`}>a.n. {r.atasNama}</p>
                  </div>
                ))}
                {catatan && <p className="text-[1.6rem] text-hijau-100">{catatan}</p>}
              </div>
            )}
          </div>
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
