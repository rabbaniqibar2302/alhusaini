"use client";

import { useState } from "react";
import type { SetelanTv } from "@/lib/schemas";
import { simpanPengaturanTv } from "@/server/aksi/tv";
import { Bidang, Centang, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

const IQOMAH = [
  { nama: "iqomahSubuh", label: "Subuh" },
  { nama: "iqomahDzuhur", label: "Dzuhur" },
  { nama: "iqomahAshar", label: "Ashar" },
  { nama: "iqomahMaghrib", label: "Maghrib" },
  { nama: "iqomahIsya", label: "Isya" },
] as const;

const ADZAN = [
  { nama: "adzanSubuh", label: "Subuh" },
  { nama: "adzanDzuhur", label: "Dzuhur" },
  { nama: "adzanAshar", label: "Ashar" },
  { nama: "adzanMaghrib", label: "Maghrib" },
  { nama: "adzanIsya", label: "Isya" },
  { nama: "adzanJumat", label: "Jumat" },
] as const;

export function FormPengaturanTv({ setelan }: { setelan: SetelanTv }) {
  const form = useFormAksi(simpanPengaturanTv, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  const [volume, setVolume] = useState(setelan.volumeAdzan);
  const angka = { type: "number", inputMode: "numeric", step: 1 } as const;

  return (
    <form onSubmit={form.onSubmit} className="space-y-6" noValidate>
      <fieldset>
        <legend className="text-sm font-semibold text-hijau-900">Putar suara adzan pada waktu</legend>
        <p className="mt-0.5 text-xs text-stone-500">
          Matikan waktu yang adzannya dikumandangkan langsung oleh muadzin, supaya tidak bersamaan. Jumat = Dzuhur hari
          Jumat (adzan biasanya dikumandangkan saat khotib naik mimbar).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ADZAN.map((w) => (
            <Centang key={w.nama} id={`tv-${w.nama}`} label={w.label} name={w.nama} defaultChecked={setelan[w.nama]} />
          ))}
        </div>
        <div className="mt-4 max-w-sm">
          <label htmlFor="tv-volumeAdzan" className="flex justify-between text-sm font-medium text-stone-700">
            Volume adzan <span className="tabular-nums">{volume}%</span>
          </label>
          <input
            id="tv-volumeAdzan"
            name="volumeAdzan"
            type="range"
            min={10}
            max={100}
            step={10}
            defaultValue={setelan.volumeAdzan}
            onChange={(e) => setVolume(Number(e.currentTarget.value))}
            className="mt-2 w-full accent-hijau-700"
          />
          {galat.volumeAdzan && <p className="mt-1 text-xs text-red-700">{galat.volumeAdzan[0]}</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-hijau-900">Jeda adzan ke iqomah (menit)</legend>
        <p className="mt-0.5 text-xs text-stone-500">
          Setelah masuk waktu sholat, layar menampilkan hitung mundur iqomah. Isi 0 untuk tidak menampilkannya.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {IQOMAH.map((w) => (
            <Bidang
              key={w.nama}
              label={w.label}
              name={w.nama}
              {...angka}
              min={0}
              max={30}
              required
              defaultValue={setelan[w.nama]}
              galat={galat[w.nama]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold text-hijau-900">Layar saat sholat & tampilan</legend>
        <Bidang
          label="Layar sholat (menit)"
          name="durasiSholat"
          {...angka}
          min={0}
          max={30}
          required
          defaultValue={setelan.durasiSholat}
          petunjuk="Layar diredupkan selama sholat berjamaah. 0 = tidak."
          galat={galat.durasiSholat}
        />
        <Bidang
          label="Layar Jumat (menit)"
          name="durasiJumat"
          {...angka}
          min={0}
          max={90}
          required
          defaultValue={setelan.durasiJumat}
          petunjuk="Sejak masuk Dzuhur hari Jumat: khutbah & sholat."
          galat={galat.durasiJumat}
        />
        <Bidang
          label="Ganti tampilan tiap (detik)"
          name="detikSlide"
          {...angka}
          min={5}
          max={120}
          required
          defaultValue={setelan.detikSlide}
          petunjuk="Foto, pengumuman, jadwal kajian, dst."
          galat={galat.detikSlide}
        />
      </fieldset>

      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>{form.pending ? "Menyimpan…" : "Simpan pengaturan"}</TombolKirim>
    </form>
  );
}
