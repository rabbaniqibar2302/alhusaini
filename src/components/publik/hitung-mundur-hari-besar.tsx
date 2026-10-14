"use client";

import { IkonBulanSabit } from "@/components/ikon";
import { useSekarang } from "@/hooks/use-sekarang";
import type { KunciAcara } from "@/lib/schemas";
import { epochWIB, formatTanggal } from "@/lib/time";

export type DataHariBesar = {
  kunci: KunciAcara;
  judul: string;
  label: string;
  ucapan: string;
  kejadian: { tanggal: string; tahunHijriah: number; sumber: "otomatis" | "penetapan"; catatan: string }[];
};

const SATU_HARI = 24 * 60 * 60 * 1000;

function pecahDurasi(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    hari: Math.floor(s / 86400),
    jam: Math.floor((s % 86400) / 3600),
    menit: Math.floor((s % 3600) / 60),
    detik: s % 60,
  };
}

function KartuHariBesar({ data, sekarang }: { data: DataHariBesar; sekarang: number | null }) {
  // Pilih kejadian pertama yang harinya belum berakhir (data server bisa sedikit usang).
  const k =
    sekarang === null
      ? data.kejadian[0]
      : data.kejadian.find((x) => sekarang < epochWIB(x.tanggal) + SATU_HARI);
  if (!k) return null;

  const mulai = epochWIB(k.tanggal);
  const sedangBerlangsung = sekarang !== null && sekarang >= mulai;
  const sisa = sekarang === null ? null : pecahDurasi(mulai - sekarang);
  const kotak: [string, number | undefined][] = [
    ["Hari", sisa?.hari],
    ["Jam", sisa?.jam],
    ["Menit", sisa?.menit],
    ["Detik", sisa?.detik],
  ];

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emas-600 uppercase">
        <IkonBulanSabit className="size-4" />
        {data.label} {k.tahunHijriah} H
      </p>
      <h3 className="mt-1 text-lg font-bold text-hijau-900">{data.judul}</h3>
      <p className="text-sm text-stone-600">{formatTanggal(k.tanggal, { hari: true })}</p>

      {sedangBerlangsung ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl bg-hijau-50 p-4 text-center ring-1 ring-hijau-100">
          <p className="font-semibold text-hijau-800">
            Hari ini {data.label} {k.tahunHijriah} H
            <span className="mt-1 block font-arab text-xl text-emas-600">{data.ucapan}</span>
          </p>
        </div>
      ) : (
        <div role="timer" className="mt-4 grid grid-cols-4 gap-2" aria-label={`Hitung mundur menuju ${data.judul}`}>
          {kotak.map(([label, nilai]) => (
            <div key={label} className="rounded-xl bg-hijau-900 px-1 py-2.5 text-center text-white">
              <span className="angka-tabular block text-2xl font-bold sm:text-3xl">
                {nilai === undefined ? "–" : String(nilai).padStart(label === "Hari" ? 1 : 2, "0")}
              </span>
              <span className="block text-[0.7rem] text-hijau-100">{label}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-stone-500">
        {k.sumber === "penetapan" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-hijau-50 px-2 py-0.5 font-medium text-hijau-700 ring-1 ring-hijau-100">
            Sesuai penetapan pemerintah{k.catatan ? ` — ${k.catatan}` : ""}
          </span>
        ) : (
          <span>Perkiraan kalender Hijriah; menunggu keputusan sidang isbat.</span>
        )}
      </p>
    </article>
  );
}

export function HitungMundurHariBesar({ acara }: { acara: DataHariBesar[] }) {
  const sekarang = useSekarang();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {acara.map((a) => (
        <KartuHariBesar key={a.kunci} data={a} sekarang={sekarang} />
      ))}
    </div>
  );
}
