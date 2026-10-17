"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IkonJam } from "@/components/ikon";
import { useSekarang } from "@/hooks/use-sekarang";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";
import { LOKASI_SHOLAT } from "@/lib/site";
import { epochWIB, formatTanggal, hariKe, tambahHari, tanggalWIB } from "@/lib/time";

type KunciWaktu = "imsak" | "subuh" | "terbit" | "dzuhur" | "ashar" | "maghrib" | "isya";

const DAFTAR_WAKTU: { kunci: KunciWaktu; label: string; sholat: boolean }[] = [
  { kunci: "imsak", label: "Imsak", sholat: false },
  { kunci: "subuh", label: "Subuh", sholat: true },
  { kunci: "terbit", label: "Terbit", sholat: false },
  { kunci: "dzuhur", label: "Dzuhur", sholat: true },
  { kunci: "ashar", label: "Ashar", sholat: true },
  { kunci: "maghrib", label: "Maghrib", sholat: true },
  { kunci: "isya", label: "Isya", sholat: true },
];

const judulKata = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

function formatDurasi(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const j = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const d = total % 60;
  return [j, m, d].map((n) => String(n).padStart(2, "0")).join(":");
}

export function JadwalSholatLangsung({
  hari,
  hijriah,
}: {
  /** Jadwal hari ini dan besok (WIB) saat halaman dibuat. */
  hari: JadwalHarian[];
  hijriah: Record<string, string>;
}) {
  const router = useRouter();
  const sekarang = useSekarang();
  const tanggalSekarang = sekarang === null ? null : tanggalWIB(sekarang);
  const jadwal = hari.find((h) => h.tanggal === tanggalSekarang) ?? hari[0];
  // Halaman cache sudah lebih dari sehari: minta versi terbaru dari server.
  const usang = tanggalSekarang !== null && !hari.some((h) => h.tanggal === tanggalSekarang);

  useEffect(() => {
    if (usang) router.refresh();
  }, [usang, router]);

  const jumat = hariKe(jadwal.tanggal) === 5;
  const labelWaktu = (k: KunciWaktu, label: string) => (k === "dzuhur" && jumat ? "Jumat" : label);

  let berikutnya: { kunci: KunciWaktu; label: string; jam: string; epoch: number } | null = null;
  if (sekarang !== null && !usang) {
    for (const w of DAFTAR_WAKTU) {
      if (!w.sholat) continue;
      const epoch = epochWIB(jadwal.tanggal, jadwal[w.kunci]);
      if (epoch > sekarang) {
        berikutnya = { kunci: w.kunci, label: labelWaktu(w.kunci, w.label), jam: jadwal[w.kunci], epoch };
        break;
      }
    }
    if (!berikutnya) {
      const tanggalBesok = tambahHari(jadwal.tanggal, 1);
      const jamSubuh = hari.find((h) => h.tanggal === tanggalBesok)?.subuh ?? jadwal.subuh;
      berikutnya = { kunci: "subuh", label: "Subuh", jam: jamSubuh, epoch: epochWIB(tanggalBesok, jamSubuh) };
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-hijau-900 p-5 text-white shadow-xl shadow-hijau-950/20 sm:p-8">
      <div className="pola-islami pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.2em] text-emas-300 uppercase">Jadwal Sholat Hari Ini</p>
        <p className="mt-1 text-xl font-bold sm:text-2xl">{formatTanggal(jadwal.tanggal, { hari: true })}</p>
        <p className="mt-0.5 text-sm text-hijau-100">
          {hijriah[jadwal.tanggal] ?? ""}
          <span className="mx-1.5 text-emas-300">•</span>
          Wilayah {LOKASI_SHOLAT.kota}
        </p>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div aria-live="polite">
            <p className="flex items-center gap-1.5 text-sm text-hijau-100">
              <IkonJam className="size-4" /> Sholat berikutnya
            </p>
            <p className="mt-0.5 text-2xl font-bold">
              {berikutnya ? (
                <>
                  {berikutnya.label} <span className="text-emas-300">{berikutnya.jam}</span>
                </>
              ) : usang ? (
                "Memperbarui jadwal…"
              ) : (
                <span className="text-hijau-100">Menghitung…</span>
              )}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-hijau-100">Hitung mundur menuju adzan</p>
            <p role="timer" className="angka-tabular font-mono text-4xl font-bold tracking-tight text-emas-200 sm:text-5xl">
              {berikutnya && sekarang !== null ? formatDurasi(berikutnya.epoch - sekarang) : "--:--:--"}
            </p>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {DAFTAR_WAKTU.map((w) => {
            const aktif = berikutnya?.kunci === w.kunci && berikutnya.jam === jadwal[w.kunci];
            const lewat =
              sekarang !== null && !usang && epochWIB(jadwal.tanggal, jadwal[w.kunci]) <= sekarang;
            return (
              <li
                key={w.kunci}
                className={`basis-[calc(25%-0.375rem)] rounded-xl px-1 py-3 text-center ring-1 transition-colors lg:basis-[calc(14.28%-0.43rem)] ${
                  aktif
                    ? "bg-emas-400 text-hijau-950 ring-emas-300"
                    : w.sholat
                      ? "bg-white/10 ring-white/15"
                      : "bg-hijau-950/40 ring-white/10"
                } ${lewat && !aktif ? "opacity-60" : ""}`}
              >
                <span className={`block text-xs font-medium ${aktif ? "text-hijau-900" : "text-hijau-100"}`}>
                  {labelWaktu(w.kunci, w.label)}
                </span>
                <span className="angka-tabular mt-0.5 block text-lg font-bold sm:text-xl">{jadwal[w.kunci]}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-center text-xs text-hijau-100/90">
          {jadwal.sumber === "kemenag"
            ? `Sumber: Kementerian Agama RI (Bimas Islam)${jadwal.lokasi ? `, wilayah ${judulKata(jadwal.lokasi)}` : ""}, melalui API myQuran. Waktu dalam WIB.`
            : "Perkiraan hasil perhitungan (metode Kemenag) karena data Kemenag sedang tidak dapat diambil. Waktu dalam WIB."}
        </p>
      </div>
    </div>
  );
}
