"use client";

import type { SetelanTv } from "@/lib/schemas";
import { simpanPengaturanTv } from "@/server/aksi/tv";
import { Bidang, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

const IQOMAH: { nama: keyof SetelanTv; label: string }[] = [
  { nama: "iqomahSubuh", label: "Subuh" },
  { nama: "iqomahDzuhur", label: "Dzuhur" },
  { nama: "iqomahAshar", label: "Ashar" },
  { nama: "iqomahMaghrib", label: "Maghrib" },
  { nama: "iqomahIsya", label: "Isya" },
];

export function FormPengaturanTv({ setelan }: { setelan: SetelanTv }) {
  const form = useFormAksi(simpanPengaturanTv, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  const angka = { type: "number", inputMode: "numeric", step: 1 } as const;

  return (
    <form onSubmit={form.onSubmit} className="space-y-6" noValidate>
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
