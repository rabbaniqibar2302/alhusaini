import Image from "next/image";
import type { ReactNode } from "react";
import { IkonBuku, IkonJam, IkonKalender } from "@/components/ikon";
import { inisialNama, type FotoPenceramah } from "@/lib/penceramah";
import { NAMA_BULAN, formatTanggal, namaHari } from "@/lib/time";

/**
 * Latar kartu penceramah: gradien hijau dengan pola Islami dan cahaya emas.
 * Foto tanpa latar diletakkan berdiri di dasar; foto biasa memenuhi area;
 * tanpa foto ditampilkan inisial nama. Ukuran mengikuti wadah, jadi dipakai
 * bersama oleh website, panel admin, dan layar TV.
 */
export function PanggungPenceramah({
  foto,
  nama,
  sizes,
  className = "",
  kelasInisial = "text-6xl",
  prioritas,
  children,
}: {
  foto: FotoPenceramah | null;
  nama: string;
  sizes: string;
  className?: string;
  kelasInisial?: string;
  prioritas?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`relative isolate overflow-hidden bg-linear-to-b from-hijau-700 via-hijau-800 to-hijau-950 ${className}`}>
      <div className="pola-islami absolute inset-0 -z-10 opacity-80" aria-hidden="true" />
      <div
        className="absolute inset-x-[-15%] top-[18%] -z-10 aspect-square rounded-full bg-radial from-emas-300/45 via-emas-400/10 to-transparent to-70%"
        aria-hidden="true"
      />
      {foto ? (
        foto.latarDihapus ? (
          // Selalu setinggi area (dengan ruang di atas kepala); foto setengah badan
          // yang lebar terpotong di kiri-kanan, bukan mengecil.
          <div className="absolute inset-x-0 top-[9%] bottom-0">
            <Image
              src={foto.url}
              alt={`Foto ${nama}`}
              width={foto.lebar}
              height={foto.tinggi}
              sizes={sizes}
              priority={prioritas}
              className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 drop-shadow-[0_12px_24px_rgb(7_34_25/0.45)]"
            />
          </div>
        ) : (
          <Image src={foto.url} alt={`Foto ${nama}`} fill sizes={sizes} priority={prioritas} className="object-cover object-top" />
        )
      ) : (
        <div className="absolute inset-0 grid place-items-center pb-[18%]" aria-hidden="true">
          <span
            className={`grid aspect-square w-[46%] place-items-center rounded-full bg-hijau-950/35 font-extrabold tracking-wide text-emas-200 ring-1 ring-emas-300/40 ${kelasInisial}`}
          >
            {inisialNama(nama) || "?"}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

export type WaktuKartu =
  | { pola: "tanggal"; hari: string; tanggal: string; bulan: string; lengkap: string }
  | { pola: "mingguan"; hari: string };

export function waktuTanggal(iso: string): WaktuKartu {
  const [, bulan, tgl] = iso.split("-").map(Number);
  return {
    pola: "tanggal",
    hari: namaHari(iso),
    tanggal: String(tgl),
    bulan: NAMA_BULAN[bulan - 1].slice(0, 3),
    // Tanpa tahun: jadwal yang tampil selalu dalam beberapa pekan ke depan.
    lengkap: formatTanggal(iso, { hari: true, singkat: true }).replace(/ \d{4}$/, ""),
  };
}

/** Ubin tanggal di pojok kartu: "RAB 21 Okt" atau "Setiap Rabu". */
export function UbinTanggal({ waktu, hariIni }: { waktu: WaktuKartu; hariIni?: boolean }) {
  const warna = hariIni ? "bg-emas-400 text-hijau-950" : "bg-white/95 text-hijau-900";
  if (waktu.pola === "mingguan") {
    return (
      <div className={`rounded-xl px-2.5 py-1.5 text-center shadow-sm ${warna}`}>
        <p className={`text-[0.6rem] font-semibold tracking-wider uppercase ${hariIni ? "" : "text-emas-600"}`}>Setiap</p>
        <p className="text-sm leading-tight font-extrabold">{waktu.hari}</p>
      </div>
    );
  }
  return (
    <div className={`min-w-13 rounded-xl px-2 py-1.5 text-center shadow-sm ${warna}`}>
      <p className={`text-[0.6rem] font-semibold tracking-wider uppercase ${hariIni ? "" : "text-emas-600"}`}>
        {hariIni ? "Hari ini" : waktu.hari.slice(0, 3)}
      </p>
      <p className="text-2xl leading-none font-extrabold tabular-nums">{waktu.tanggal}</p>
      <p className="text-[0.7rem] font-medium">{waktu.bulan}</p>
    </div>
  );
}

/** Kartu jadwal penceramah untuk website (khotib Jumat & kajian). */
export function KartuPenceramah({
  nama,
  peran,
  kategori,
  ikonKategori,
  foto,
  waktu,
  jam,
  materi,
  tambahan,
  hariIni,
  sizes = "(min-width: 1024px) 270px, (min-width: 640px) 45vw, 75vw",
}: {
  nama: string;
  /** Mis. "Khotib" atau "Pemateri". */
  peran: string;
  kategori: string;
  ikonKategori?: ReactNode;
  foto: FotoPenceramah | null;
  waktu: WaktuKartu;
  jam?: string;
  materi?: string;
  /** Baris kecil tambahan, mis. "Imam: ...". */
  tambahan?: ReactNode;
  hariIni?: boolean;
  sizes?: string;
}) {
  return (
    <article
      className={`group flex h-full flex-col rounded-[1.75rem] bg-white p-2 shadow-sm ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-hijau-950/10 ${
        hariIni ? "ring-2 ring-emas-400" : "ring-stone-200/80"
      }`}
    >
      <PanggungPenceramah foto={foto} nama={nama} sizes={sizes} className="aspect-[4/5] rounded-[1.4rem]">
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 rounded-full bg-hijau-950/45 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider text-white uppercase ring-1 ring-white/15 backdrop-blur-sm">
            {ikonKategori}
            <span className="truncate">{kategori}</span>
          </p>
          <UbinTanggal waktu={waktu} hariIni={hariIni} />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-hijau-950 via-hijau-950/80 to-transparent px-4 pt-16 pb-4">
          <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-emas-300 uppercase">{peran}</p>
          <h3 className="mt-0.5 line-clamp-2 text-lg leading-snug font-bold text-balance text-white">{nama}</h3>
        </div>
      </PanggungPenceramah>
      <div className="flex flex-1 flex-col px-2.5 pt-3 pb-1.5">
        {materi && (
          <p className="flex items-start gap-2 text-sm leading-snug text-stone-700">
            <IkonBuku className="mt-0.5 size-4 shrink-0 text-emas-600" />
            <span className="line-clamp-2">{materi}</span>
          </p>
        )}
        {tambahan && <div className="mt-1.5 text-xs text-stone-500">{tambahan}</div>}
        <div className={`flex-1 ${materi || tambahan ? "min-h-3" : ""}`} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-stone-100 pt-2.5 text-xs font-medium text-stone-600">
          <span className="flex items-center gap-1.5">
            <IkonKalender className="size-3.5 text-hijau-700" />
            {waktu.pola === "mingguan" ? `Setiap ${waktu.hari}` : waktu.lengkap}
          </span>
          {jam && (
            <span className="flex items-center gap-1.5 text-hijau-800">
              <IkonJam className="size-3.5" />
              {jam}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
