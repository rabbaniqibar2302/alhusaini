"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IkonJam } from "@/components/ikon";
import { useSekarang } from "@/hooks/use-sekarang";
import { DAFTAR_WAKTU, formatDurasi, jadwalUntuk, labelWaktu, sholatBerikutnya } from "@/lib/sholat-berikutnya";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";
import { LOKASI_SHOLAT } from "@/lib/site";
import { epochWIB, formatTanggal } from "@/lib/time";
import { AngkaBerganti } from "./angka-berganti";

const judulKata = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

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
  // Halaman cache sudah lebih dari sehari: minta versi terbaru dari server.
  const { jadwal, usang } = jadwalUntuk(hari, sekarang);

  useEffect(() => {
    if (usang) router.refresh();
  }, [usang, router]);

  const berikutnya = sekarang !== null ? sholatBerikutnya(hari, sekarang) : null;
  const kemajuan =
    berikutnya && sekarang !== null
      ? Math.min(1, Math.max(0, (sekarang - berikutnya.epochSebelumnya) / (berikutnya.epoch - berikutnya.epochSebelumnya)))
      : 0;

  return (
    <div className="sinar-tepi relative overflow-hidden rounded-3xl bg-utama-900 p-5 text-white shadow-2xl shadow-utama-950/25 [--tebal-sinar:1.5px] sm:p-8">
      <div className="pola-islami pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-radial from-aksen-400/25 to-transparent to-70% motion-safe:animate-melayang"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.2em] text-aksen-300 uppercase">Jadwal Sholat Hari Ini</p>
        <p className="mt-1 text-xl font-bold sm:text-2xl">{formatTanggal(jadwal.tanggal, { hari: true })}</p>
        <p className="mt-0.5 text-sm text-utama-100">
          {hijriah[jadwal.tanggal] ?? ""}
          <span className="mx-1.5 text-aksen-300">•</span>
          Wilayah {LOKASI_SHOLAT.kota}
        </p>

        <div className="mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-utama-100">
                {berikutnya ? (
                  <span className="relative flex size-2.5" aria-hidden="true">
                    <span className="absolute inline-flex size-full rounded-full bg-aksen-300 opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-aksen-300" />
                  </span>
                ) : (
                  <IkonJam className="size-4" />
                )}
                Sholat berikutnya
              </p>
              <p className="mt-0.5 text-2xl font-bold">
                {berikutnya ? (
                  <>
                    {berikutnya.label} <span className="text-aksen-300">{berikutnya.jam}</span>
                  </>
                ) : usang ? (
                  "Memperbarui jadwal…"
                ) : (
                  <span className="text-utama-100">Menghitung…</span>
                )}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-utama-100">Hitung mundur menuju adzan</p>
              <p role="timer" className="angka-tabular font-mono text-4xl font-bold tracking-tight text-aksen-200 sm:text-5xl">
                {berikutnya && sekarang !== null ? (
                  <AngkaBerganti teks={formatDurasi(berikutnya.epoch - sekarang)} />
                ) : (
                  "--:--:--"
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className="h-full rounded-full bg-linear-to-r from-aksen-500 via-aksen-300 to-aksen-100 transition-[width] duration-1000 ease-linear"
              style={{ width: `${kemajuan * 100}%` }}
            />
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {DAFTAR_WAKTU.map((w) => {
            const aktif = berikutnya?.kunci === w.kunci && berikutnya.jam === jadwal[w.kunci];
            const lewat = sekarang !== null && !usang && epochWIB(jadwal.tanggal, jadwal[w.kunci]) <= sekarang;
            return (
              <li
                key={w.kunci}
                className={`basis-[calc(25%-0.375rem)] rounded-xl px-1 py-3 text-center ring-1 transition duration-500 lg:basis-[calc(14.28%-0.43rem)] ${
                  aktif
                    ? "-translate-y-0.5 bg-linear-to-b from-aksen-300 to-aksen-400 text-utama-950 shadow-lg shadow-aksen-500/30 ring-aksen-200"
                    : w.sholat
                      ? "bg-white/10 ring-white/15"
                      : "bg-utama-950/40 ring-white/10"
                } ${lewat && !aktif ? "opacity-60" : ""}`}
              >
                <span className={`block text-xs font-medium ${aktif ? "text-utama-900" : "text-utama-100"}`}>
                  {labelWaktu(jadwal, w.kunci, w.label)}
                </span>
                <span className="angka-tabular mt-0.5 block text-lg font-bold sm:text-xl">{jadwal[w.kunci]}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-center text-xs text-utama-100/90">
          {jadwal.sumber === "kemenag"
            ? `Sumber: Kementerian Agama RI (Bimas Islam)${jadwal.lokasi ? `, wilayah ${judulKata(jadwal.lokasi)}` : ""}, melalui API myQuran. Waktu dalam WIB.`
            : "Perkiraan hasil perhitungan (metode Kemenag) karena data Kemenag sedang tidak dapat diambil. Waktu dalam WIB."}
        </p>
      </div>
    </div>
  );
}
