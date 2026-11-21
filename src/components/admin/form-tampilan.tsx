"use client";

import { useEffect, useState } from "react";
import { IkonCentang, IkonTautanLuar } from "@/components/ikon";
import { KUNCI_TEMA, TEMA, variabelTema, warna, type KunciTema, type Tingkat } from "@/lib/tema";
import { simpanTampilan } from "@/server/aksi/tampilan";
import { Kartu, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

/** Mengganti variabel warna di halaman ini, untuk pratinjau sebelum disimpan. */
function terapkanDiHalaman(kunci: KunciTema) {
  const gaya = document.documentElement.style;
  for (const [nama, nilai] of Object.entries(variabelTema(kunci))) gaya.setProperty(nama, nilai);
}

/** Miniatur halaman depan dengan warna tema (header, judul bagian, kartu jadwal, tombol). */
function MiniaturTema({ kunci }: { kunci: KunciTema }) {
  const tema = TEMA[kunci];
  const u = (t: Tingkat) => warna(tema, "utama", t);
  const a = (t: Tingkat) => warna(tema, "aksen", t);
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl ring-1 ring-black/5" style={{ backgroundColor: tema.krem }}>
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ backgroundColor: u(950) }}>
        <span className="size-3 rounded-full" style={{ backgroundColor: a(400) }} />
        <span className="h-1.5 w-10 rounded-full opacity-80" style={{ backgroundColor: u(100) }} />
        <span className="ml-auto h-1.5 w-6 rounded-full opacity-40" style={{ backgroundColor: u(100) }} />
      </div>
      <div className="p-2.5">
        <span className="block h-1.5 w-8 rounded-full" style={{ backgroundColor: a(600) }} />
        <span className="mt-1.5 block h-2.5 w-20 rounded-full" style={{ backgroundColor: u(900) }} />
        <div className="mt-2.5 rounded-lg p-2" style={{ backgroundColor: u(900) }}>
          <span className="block h-1.5 w-12 rounded-full" style={{ backgroundColor: a(300) }} />
          <span className="mt-1.5 block h-2 w-16 rounded-full bg-white/90" />
          <div className="mt-2 flex gap-1.5">
            <span className="h-4 w-12 rounded-full" style={{ backgroundColor: a(400) }} />
            <span className="h-4 w-10 rounded-full" style={{ backgroundColor: u(800) }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormTampilan({ tema }: { tema: KunciTema }) {
  const [pilihan, setPilihan] = useState<KunciTema>(tema);
  const form = useFormAksi(simpanTampilan, { resetSaatSukses: false });

  // Panel admin langsung memakai warna pilihan; kembali ke tema tersimpan saat halaman ditinggalkan.
  useEffect(() => {
    terapkanDiHalaman(pilihan);
    return () => terapkanDiHalaman(tema);
  }, [pilihan, tema]);

  return (
    <form onSubmit={form.onSubmit} className="space-y-5">
      <Kartu
        judul="Tema warna"
        deskripsi="Warna panel ini langsung berubah saat tema dipilih, sebagai pratinjau. Tekan “Terapkan tema” untuk memakainya di website."
      >
        <fieldset>
          <legend className="sr-only">Pilih tema warna</legend>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {KUNCI_TEMA.map((k) => {
              const t = TEMA[k];
              const dipilih = k === pilihan;
              return (
                <label
                  key={k}
                  className={`relative flex cursor-pointer flex-col rounded-2xl p-2.5 ring-1 transition has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-aksen-400 ${
                    dipilih ? "bg-utama-50 ring-2 ring-utama-600" : "bg-white ring-stone-200 hover:ring-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tema"
                    value={k}
                    checked={dipilih}
                    onChange={() => setPilihan(k)}
                    className="sr-only"
                  />
                  <MiniaturTema kunci={k} />
                  <span className="mt-2.5 flex items-center gap-2 px-0.5">
                    <span className="flex -space-x-1" aria-hidden="true">
                      {[warna(t, "utama", 800), warna(t, "utama", 500), warna(t, "aksen", 400)].map((w) => (
                        <span key={w} className="size-3.5 rounded-full ring-2 ring-white" style={{ backgroundColor: w }} />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-stone-900">{t.nama}</span>
                  </span>
                  <span className="mt-1 px-0.5 text-xs leading-snug text-stone-600">{t.deskripsi}</span>
                  {k === tema && (
                    <span className="mt-2 self-start rounded-full bg-stone-100 px-2 py-0.5 text-[0.7rem] font-semibold text-stone-600">
                      Sedang dipakai
                    </span>
                  )}
                  {dipilih && (
                    <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-utama-700 text-white shadow">
                      <IkonCentang className="size-3.5" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      </Kartu>

      <PesanHasil hasil={form.hasil} />
      <div className="flex flex-wrap items-center gap-3">
        <TombolKirim pending={form.pending}>{form.pending ? "Menerapkan…" : "Terapkan tema"}</TombolKirim>
        {pilihan !== tema && (
          <button
            type="button"
            onClick={() => setPilihan(tema)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Batalkan pratinjau
          </button>
        )}
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-utama-800 underline-offset-2 hover:underline"
        >
          Lihat website <IkonTautanLuar className="size-4" />
        </a>
      </div>
    </form>
  );
}
