"use client";

import { useMemo } from "react";
import type { DataHariBesar } from "@/components/publik/hitung-mundur-hari-besar";
import {
  IkonBulan,
  IkonBulanSabit,
  IkonFajar,
  IkonLayarPenuh,
  IkonMatahari,
  IkonPengumuman,
  IkonPin,
  IkonSenja,
  IkonSuara,
  IkonSuaraMati,
} from "@/components/ikon";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import { useSekarang } from "@/hooks/use-sekarang";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { jadwalPerhitungan } from "@/lib/hitung-sholat";
import { JENIS_KAJIAN, kajianDalamRentang, type JenisKajian } from "@/lib/kajian";
import { formatHitungMundur, hitungFase, type FaseTv } from "@/lib/layar-tv";
import { pengumumanAktif } from "@/lib/pengumuman";
import type { KajianItem, KhotibItem, PengumumanItem, SetelanTv } from "@/lib/schemas";
import { SITE } from "@/lib/site";
import { WIB_OFFSET_MS, epochWIB, formatTanggal, hariKe, tambahHari, tanggalWIB } from "@/lib/time";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";
import {
  alihkanLayarPenuh,
  useInteraksiBaru,
  useLayarTetapMenyala,
  usePembaruanOtomatis,
  useSelisihWaktuServer,
  useTombolLayarPenuh,
} from "./hook-tv";
import { JamAnalog } from "./jam-analog";
import { IsiSlide, type GambarTv, type HariBesarTv, type SlideTv } from "./slide-tv";
import { useSuaraAdzan, type AdzanTv } from "./suara-adzan";

export type DataTv = {
  /** Jadwal sholat hari ini & besok saat halaman dibuat. */
  sholat: JadwalHarian[];
  hijriah: Record<string, string>;
  koreksiHijriah: number;
  logo: LogoTampil | null;
  fotoMasjid: GambarTv | null;
  pengumuman: PengumumanItem[];
  khotib: KhotibItem[];
  kajian: Record<JenisKajian, KajianItem[]>;
  kegiatan: { id: string; judul: string; tanggal: string; foto: GambarTv }[];
  hariBesar: DataHariBesar[];
  setelan: SetelanTv;
  /** URL file adzan (umum & Subuh) di Vercel Blob. */
  adzan: AdzanTv;
};

const DAFTAR_WAKTU = [
  { kunci: "imsak", label: "Imsak", Ikon: IkonBulanSabit },
  { kunci: "subuh", label: "Subuh", Ikon: IkonFajar },
  { kunci: "terbit", label: "Terbit", Ikon: IkonMatahari },
  { kunci: "dzuhur", label: "Dzuhur", Ikon: IkonMatahari },
  { kunci: "ashar", label: "Ashar", Ikon: IkonMatahari },
  { kunci: "maghrib", label: "Maghrib", Ikon: IkonSenja },
  { kunci: "isya", label: "Isya", Ikon: IkonBulan },
] as const;

const PEMISAH = "   ✦   ";

function potong<T>(daftar: T[], ukuran: number): T[][] {
  const hasil: T[][] = [];
  for (let i = 0; i < daftar.length; i += ukuran) hasil.push(daftar.slice(i, i + ukuran));
  return hasil;
}

function halaman(i: number, total: number) {
  return total > 1 ? `${i + 1} / ${total}` : "";
}

/** Urutan tampilan yang bergantian di area utama layar. */
function susunSlide(data: DataTv, tanggal: string): SlideTv[] {
  const slide: SlideTv[] = [{ jenis: "foto", kunci: "foto", foto: data.fotoMasjid }];

  const pengumuman = potong(pengumumanAktif(data.pengumuman, tanggal), 3).slice(0, 3);
  pengumuman.forEach((items, i) =>
    slide.push({ jenis: "pengumuman", kunci: `pengumuman-${i}`, items, halaman: halaman(i, pengumuman.length) }),
  );

  // Data contoh tidak ditampilkan di TV supaya jamaah tidak salah informasi.
  const kajianAsli = Object.fromEntries(
    JENIS_KAJIAN.map((j) => [j, data.kajian[j].filter((x) => !x.contoh)]),
  ) as Record<JenisKajian, KajianItem[]>;
  const kajian = potong(kajianDalamRentang(kajianAsli, tanggal, 7), 5).slice(0, 2);
  kajian.forEach((items, i) =>
    slide.push({
      jenis: "kajian",
      kunci: `kajian-${i}`,
      items,
      halaman: `7 hari ke depan${kajian.length > 1 ? ` · ${halaman(i, kajian.length)}` : ""}`,
    }),
  );

  const khotib = data.khotib.filter((x) => !x.contoh && x.tanggal >= tanggal).slice(0, 2);
  if (khotib.length > 0) slide.push({ jenis: "khotib", kunci: "khotib", items: khotib });

  const [kegiatanPertama, ...kegiatanLain] = data.kegiatan.map(
    (k): SlideTv => ({ jenis: "kegiatan", kunci: `kegiatan-${k.id}`, judul: k.judul, tanggal: k.tanggal, foto: k.foto }),
  );
  if (kegiatanPertama) slide.push(kegiatanPertama);

  const hariBesar: HariBesarTv[] = data.hariBesar.flatMap((a) => {
    const k = a.kejadian.find((x) => x.tanggal >= tanggal);
    return k ? [{ kunci: a.kunci, judul: a.judul, label: a.label, ucapan: a.ucapan, tanggal: k.tanggal, tahunHijriah: k.tahunHijriah }] : [];
  });
  if (hariBesar.length > 0) slide.push({ jenis: "hari-besar", kunci: "hari-besar", acara: hariBesar });

  slide.push(...kegiatanLain);
  return slide;
}

function JamDigital({ sekarang, kecil = false }: { sekarang: number | null; kecil?: boolean }) {
  const d = sekarang === null ? null : new Date(sekarang + WIB_OFFSET_MS);
  const dua = (n: number) => String(n).padStart(2, "0");
  const jm = d ? `${dua(d.getUTCHours())}:${dua(d.getUTCMinutes())}` : "--:--";
  const dt = d ? dua(d.getUTCSeconds()) : "--";
  return (
    <p className={`leading-none font-bold tabular-nums ${kecil ? "text-[2.6rem]" : "text-[5rem]"}`}>
      {jm}
      <span className={`text-emas-300 ${kecil ? "text-[1.6rem]" : "text-[2.5rem]"}`}>:{dt}</span>
    </p>
  );
}

function AdzanBerkumandang({ label, gelap = false }: { label: string; gelap?: boolean }) {
  return (
    <p className={`mb-6 flex items-center gap-3 text-[2.4rem] font-semibold ${gelap ? "text-white/70" : "text-hijau-50"}`}>
      <IkonSuara className="size-[2.6rem] animate-pulse text-emas-300" /> Adzan {label} sedang berkumandang
    </p>
  );
}

function LayarFase({
  fase,
  sekarang,
  logo,
  adzan,
}: {
  fase: Exclude<FaseTv, { jenis: "normal" }>;
  sekarang: number;
  logo: LogoTampil | null;
  /** Label waktu sholat bila adzannya sedang diputar. */
  adzan: string | null;
}) {
  const gelap = fase.jenis !== "iqomah";
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col p-10 ${gelap ? "bg-black text-white/80" : "pola-islami bg-hijau-950 text-white"}`}
    >
      <div className={`flex items-center justify-between ${gelap ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-4">
          <LogoMasjid logo={logo} className="size-[4.5rem]" ikonClassName="size-10" sizes="144px" />
          <p className="text-[2.2rem] font-bold">{SITE.nama}</p>
        </div>
        <JamDigital sekarang={sekarang} kecil />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {fase.jenis === "iqomah" && (
          <>
            {adzan && <AdzanBerkumandang label={adzan} />}
            <p className="text-[3rem] font-semibold text-emas-300">Waktu Sholat {fase.sholat.label} · {fase.sholat.jam}</p>
            <p className="mt-4 text-[4.4rem] font-extrabold tracking-[0.35em]">IQOMAH</p>
            <p className="mt-2 text-[17rem] leading-none font-extrabold text-emas-200 tabular-nums">
              {formatHitungMundur(fase.selesai - sekarang, true)}
            </p>
            <p className="mt-10 text-[2.4rem] text-hijau-50">Luruskan dan rapatkan shaf. Mohon nonaktifkan HP.</p>
          </>
        )}
        {fase.jenis === "sholat" && (
          <>
            <p className="text-[4.2rem] font-bold">Sholat {fase.sholat.label} sedang berlangsung</p>
            <p className="mt-6 text-[2.2rem] text-white/50">Mohon jaga ketenangan dan nonaktifkan HP</p>
          </>
        )}
        {fase.jenis === "jumat" && (
          <>
            {adzan && <AdzanBerkumandang label={adzan} gelap />}
            <p className="text-[2.4rem] font-semibold tracking-[0.3em] text-emas-300/80 uppercase">Sholat Jumat</p>
            <p className="mt-4 text-[4.2rem] font-bold">Khutbah sedang berlangsung</p>
            <p className="mt-6 text-[2.2rem] text-white/50">Harap tenang, tidak berbicara, dan nonaktifkan HP</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Tampilan untuk TV di dalam masjid (16:9, 1920×1080 dan diskalakan).
 * Semua perhitungan waktu memakai jam WIB yang disinkronkan dengan server.
 */
export function LayarTv({ data }: { data: DataTv }) {
  const selisih = useSelisihWaktuServer();
  const kini = useSekarang();
  const sekarang = kini === null ? null : kini + selisih;
  const tanggal = sekarang === null ? data.sholat[0].tanggal : tanggalWIB(sekarang);
  const dataUsang = sekarang !== null && !data.sholat.some((h) => h.tanggal === tanggal);

  usePembaruanOtomatis(dataUsang, tanggal);
  useLayarTetapMenyala();
  useTombolLayarPenuh();
  const interaksi = useInteraksiBaru();

  const { jadwal, besok } = useMemo(() => {
    const t = tambahHari(tanggal, 1);
    return {
      // Bila internet putus lebih dari sehari, pakai perhitungan lokal (metode Kemenag).
      jadwal: data.sholat.find((h) => h.tanggal === tanggal) ?? jadwalPerhitungan(tanggal),
      besok: data.sholat.find((h) => h.tanggal === t) ?? jadwalPerhitungan(t),
    };
  }, [data.sholat, tanggal]);

  const { hijriah, ramadhan } = useMemo(() => {
    try {
      const h = keHijriah(tanggal, data.koreksiHijriah);
      return { hijriah: data.hijriah[tanggal] ?? formatHijriah(h), ramadhan: h.bulan === 9 };
    } catch {
      return { hijriah: data.hijriah[tanggal] ?? "", ramadhan: false };
    }
  }, [data.hijriah, data.koreksiHijriah, tanggal]);

  const slide = useMemo(() => susunSlide(data, tanggal), [data, tanggal]);
  const teksBerjalan = useMemo(() => {
    const aktif = pengumumanAktif(data.pengumuman, tanggal).map((x) => x.teks);
    return (aktif.length > 0 ? aktif : [`Selamat datang di ${SITE.nama}`, SITE.alamatSingkat]).join(PEMISAH);
  }, [data.pengumuman, tanggal]);

  const fase = sekarang === null ? null : hitungFase(sekarang, jadwal, besok, data.setelan);
  const suara = useSuaraAdzan({ adzan: data.adzan, setelan: data.setelan, jadwal, tanggal, sekarang, fase });
  const indeksSlide = sekarang === null ? 0 : Math.floor(sekarang / (data.setelan.detikSlide * 1000)) % slide.length;
  const jumat = hariKe(tanggal) === 5;

  const kunciAktif = fase === null ? null : fase.jenis === "normal" ? fase.berikut.kunci : fase.sholat.kunci;
  const jamAktif = fase === null ? null : fase.jenis === "normal" ? fase.berikut.jam : fase.sholat.jam;
  const waktu = DAFTAR_WAKTU.filter((w) => w.kunci !== "imsak" || ramadhan);

  const sisaMenuju = fase?.jenis === "normal" && sekarang !== null ? fase.berikut.epoch - sekarang : null;
  // 10 menit terakhir: kotak hitung mundur berkedip; 5 menit terakhir: hitung mundur besar.
  const menjelang = sisaMenuju !== null && sisaMenuju <= 10 * 60_000;

  return (
    <div
      data-layar-tv
      data-suara={suara.adzanBerkumandang ? "adzan" : suara.sedangUji ? "uji" : undefined}
      className={`fixed inset-0 grid place-items-center overflow-hidden bg-black text-white select-none ${
        interaksi ? "" : "cursor-none"
      }`}
    >
      <div className="pola-islami relative flex h-[67.5rem] w-[120rem] flex-col overflow-hidden bg-hijau-950">
        <div className="flex min-h-0 flex-1">
          {/* Kiri: identitas masjid + tampilan bergantian */}
          <div className="flex min-w-0 flex-1 flex-col p-8 pr-7">
            <header className="flex items-center gap-6">
              <LogoMasjid logo={data.logo} className="size-[7.5rem]" ikonClassName="size-16" sizes="240px" priority />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-5">
                  <h1 className="truncate text-[3.6rem] leading-none font-extrabold tracking-tight">{SITE.nama}</h1>
                  <p lang="ar" dir="rtl" className="shrink-0 font-arab text-[2.5rem] leading-none text-emas-300">
                    {SITE.namaArab}
                  </p>
                </div>
                <p className="mt-3 flex items-center gap-2 truncate text-[1.45rem] text-hijau-100">
                  <IkonPin className="size-[1.6rem] shrink-0 text-emas-300" />
                  {SITE.alamatSingkat}
                </p>
              </div>
              {fase?.jenis === "normal" && sisaMenuju !== null && (
                <div
                  className={`shrink-0 rounded-[1.4rem] px-7 py-3 text-right ring-1 ${
                    menjelang ? "animate-pulse bg-emas-400 text-hijau-950 ring-emas-200" : "bg-hijau-900 ring-white/15"
                  }`}
                >
                  <p className={`text-[1.45rem] ${menjelang ? "font-semibold" : "text-hijau-100"}`}>
                    Menuju adzan <span className="font-bold">{fase.berikut.label}</span> · {fase.berikut.jam}
                  </p>
                  <p
                    className={`text-[3.3rem] leading-tight font-extrabold tabular-nums ${menjelang ? "" : "text-emas-300"}`}
                  >
                    −{formatHitungMundur(sisaMenuju)}
                  </p>
                </div>
              )}
            </header>

            <div className="relative mt-6 min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-hijau-900 ring-1 ring-white/10">
              {slide.map((s, i) => (
                <div
                  key={s.kunci}
                  aria-hidden={i !== indeksSlide}
                  className={`absolute inset-0 transition-opacity duration-1000 ${i === indeksSlide ? "opacity-100" : "opacity-0"}`}
                >
                  <IsiSlide slide={s} hariIni={tanggal} />
                </div>
              ))}

              {fase?.jenis === "normal" && suara.adzanBerkumandang && (
                <div className="pola-islami absolute inset-0 z-10 flex flex-col items-center justify-center bg-hijau-950 text-center">
                  <IkonSuara className="size-[6rem] animate-pulse text-emas-300" />
                  <p className="mt-4 text-[4rem] font-extrabold">Adzan {suara.adzanBerkumandang}</p>
                  <p className="mt-2 text-[2.1rem] text-hijau-50">sedang berkumandang</p>
                </div>
              )}
              {fase?.jenis === "normal" && !suara.adzanBerkumandang && sisaMenuju !== null && sisaMenuju <= 5 * 60_000 && (
                <div className="pola-islami absolute inset-0 z-10 flex flex-col items-center justify-center bg-hijau-950 text-center">
                  <p className="text-[2.6rem] font-semibold text-emas-300">Sebentar lagi adzan {fase.berikut.label}</p>
                  <p className="mt-2 text-[13rem] leading-none font-extrabold text-emas-200 tabular-nums">
                    {formatHitungMundur(sisaMenuju, true)}
                  </p>
                  <p className="mt-6 text-[2.1rem] text-hijau-50">Mari bersiap menunaikan sholat berjamaah</p>
                </div>
              )}
            </div>
          </div>

          {/* Kanan: jam, tanggal, dan jadwal sholat */}
          <aside className="flex w-[36rem] shrink-0 flex-col border-l border-white/10 bg-hijau-900/85">
            <div className="px-8 pt-7 pb-5 text-center">
              <div className="flex items-center justify-center gap-6">
                <JamAnalog sekarang={sekarang} className="size-[11.5rem] shrink-0" />
                <div className="text-left">
                  <JamDigital sekarang={sekarang} />
                  <p className="mt-2 text-[1.4rem] tracking-[0.3em] text-hijau-100">WIB</p>
                </div>
              </div>
              <p className="mt-5 text-[1.9rem] leading-tight font-semibold">{formatTanggal(tanggal, { hari: true })}</p>
              <p className="mt-1 text-[1.65rem] text-emas-300">{hijriah}</p>
            </div>
            <ul className="flex flex-1 flex-col">
              {waktu.map(({ kunci, label, Ikon }) => {
                const jam = jadwal[kunci];
                const aktif = kunciAktif === kunci && jamAktif === jam;
                const lewat = sekarang !== null && !aktif && epochWIB(tanggal, jam) <= sekarang;
                const sholat = kunci !== "imsak" && kunci !== "terbit";
                return (
                  <li
                    key={kunci}
                    className={`flex flex-1 items-center gap-5 border-t px-8 transition-colors ${
                      aktif ? "border-emas-300 bg-emas-400 text-hijau-950" : "border-white/10"
                    } ${lewat ? "opacity-50" : ""}`}
                  >
                    <Ikon className={`size-[2.6rem] shrink-0 ${aktif ? "" : sholat ? "text-emas-300" : "text-hijau-200"}`} />
                    <span className={`flex-1 text-[2.1rem] ${sholat ? "font-semibold" : ""}`}>
                      {kunci === "dzuhur" && jumat ? "Jumat" : label}
                    </span>
                    <span className="text-[3.3rem] font-extrabold tabular-nums">{jam}</span>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-white/10 px-8 py-2.5 text-center text-[1.15rem] text-hijau-100">
              {jadwal.sumber === "kemenag" ? "Sumber: Kemenag RI (myQuran)" : "Perkiraan perhitungan metode Kemenag"} ·{" "}
              {SITE.kotaJadwalSholat}
            </p>
          </aside>
        </div>

        {/* Bawah: teks berjalan */}
        <div className="flex h-[5.5rem] shrink-0 items-center bg-emas-400 text-hijau-950">
          <div className="flex h-full shrink-0 items-center gap-3 bg-hijau-800 px-8 text-[1.7rem] font-extrabold tracking-wider text-emas-300">
            <IkonPengumuman className="size-[2.2rem]" /> INFO
          </div>
          <div className="relative h-full min-w-0 flex-1 overflow-hidden">
            <div
              key={teksBerjalan}
              className="teks-berjalan absolute inset-y-0 left-0 flex w-max items-center"
              style={{ animationDuration: `${Math.max(25, teksBerjalan.length * 0.22)}s` }}
            >
              <span className="pr-[6rem] pl-8 text-[2.1rem] font-semibold whitespace-nowrap">{teksBerjalan}</span>
              <span aria-hidden="true" className="pr-[6rem] pl-8 text-[2.1rem] font-semibold whitespace-nowrap">
                {teksBerjalan}
              </span>
            </div>
          </div>
        </div>

        {fase && fase.jenis !== "normal" && sekarang !== null && (
          <LayarFase fase={fase} sekarang={sekarang} logo={data.logo} adzan={suara.adzanBerkumandang} />
        )}

        {suara.perluIzin && (
          <p
            role="status"
            className="absolute bottom-[7rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-emas-400 px-8 py-3.5 text-[1.6rem] font-semibold whitespace-nowrap text-hijau-950 shadow-2xl ring-4 ring-emas-200/60"
          >
            <IkonSuaraMati className="size-[2.2rem] shrink-0" />
            Suara adzan belum aktif — klik layar atau tekan tombol OK pada remote (Enter pada keyboard)
          </p>
        )}

        <div
          className={`absolute top-5 right-5 z-30 flex gap-3 transition-opacity ${
            interaksi ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {suara.adaFile && (
            <button
              type="button"
              onClick={suara.uji}
              className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-3 text-[1.3rem] font-semibold text-white ring-1 ring-white/30"
            >
              <IkonSuara className="size-[1.8rem]" />
              {suara.sedangUji || suara.adzanBerkumandang ? "Hentikan suara" : "Tes suara adzan"}
            </button>
          )}
          <button
            type="button"
            onClick={alihkanLayarPenuh}
            className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-3 text-[1.3rem] font-semibold text-white ring-1 ring-white/30"
          >
            <IkonLayarPenuh className="size-[1.8rem]" /> Layar penuh (F)
          </button>
        </div>
      </div>
    </div>
  );
}
