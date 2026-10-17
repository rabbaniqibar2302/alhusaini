"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IkonCentang, IkonPeringatan } from "@/components/ikon";
import { PanggungPenceramah } from "@/components/kartu-penceramah";
import type { FotoPenceramah } from "@/lib/penceramah";
import { ACCEPT_FOTO, siapkanFoto } from "./foto-klien";
import { hapusLatar, hapusLatarDidukung, type StatusHapusLatar } from "./hapus-latar";

// Foto dari HP bisa besar; yang dikirim ke server hanya hasil olahannya.
const UKURAN_SUMBER_MAKS = 20 * 1024 * 1024;

type Pilihan = { file: File; url: string; lebar?: number; tinggi?: number };

type Keadaan =
  | { tahap: "kosong" }
  | { tahap: "olah"; status: StatusHapusLatar | null }
  | { tahap: "siap"; asli: Pilihan; tanpaLatar: Pilihan | null; pakai: "tanpaLatar" | "asli"; catatan?: string };

function setFile(input: HTMLInputElement, file: File | null) {
  const dt = new DataTransfer();
  if (file) dt.items.add(file);
  input.files = dt.files;
}

/**
 * Pilih foto penceramah: latar belakang dihapus otomatis di browser, lalu
 * hasilnya (atau foto asli, bila dipilih) dikirim bersama form sebagai
 * field `foto` + `latarDihapus`.
 */
export function InputFotoPenceramah({
  nama,
  tersimpan,
  wajib = false,
  galat,
  onSibuk,
}: {
  /** Nama penceramah untuk pratinjau kartu. */
  nama: string;
  /** Foto yang sudah tersimpan untuk nama ini (dipakai otomatis bila tidak diganti). */
  tersimpan: FotoPenceramah | null;
  wajib?: boolean;
  galat?: string[];
  onSibuk?: (sibuk: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keadaan, setKeadaan] = useState<Keadaan>({ tahap: "kosong" });
  const [salah, setSalah] = useState("");
  const onSibukRef = useRef(onSibuk);
  useEffect(() => {
    onSibukRef.current = onSibuk;
  });

  const sibuk = keadaan.tahap === "olah";
  useEffect(() => {
    onSibukRef.current?.(sibuk);
  }, [sibuk]);

  // Lepas object URL pratinjau saat foto diganti/dilepas (bukan saat beralih asli ↔ tanpa latar).
  const urlAsli = keadaan.tahap === "siap" ? keadaan.asli.url : null;
  const urlTanpaLatar = keadaan.tahap === "siap" ? (keadaan.tanpaLatar?.url ?? null) : null;
  useEffect(() => {
    return () => {
      if (urlAsli) URL.revokeObjectURL(urlAsli);
      if (urlTanpaLatar) URL.revokeObjectURL(urlTanpaLatar);
    };
  }, [urlAsli, urlTanpaLatar]);

  // Kosongkan setelah form berhasil disimpan (form di-reset).
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const saatReset = () => {
      setKeadaan({ tahap: "kosong" });
      setSalah("");
    };
    form.addEventListener("reset", saatReset);
    return () => form.removeEventListener("reset", saatReset);
  }, []);

  async function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setSalah("");
    if (!file) {
      setKeadaan({ tahap: "kosong" });
      return;
    }
    setKeadaan({ tahap: "olah", status: null });

    // Foto asli (diperkecil bila perlu) sebagai cadangan.
    const siap = await siapkanFoto(file, UKURAN_SUMBER_MAKS);
    if ("galat" in siap) {
      setFile(input, null);
      setKeadaan({ tahap: "kosong" });
      setSalah(siap.galat);
      return;
    }
    const asli: Pilihan = { file: siap.file, url: URL.createObjectURL(siap.file) };

    if (!hapusLatarDidukung()) {
      setFile(input, asli.file);
      setKeadaan({
        tahap: "siap",
        asli,
        tanpaLatar: null,
        pakai: "asli",
        catatan: "Browser ini belum bisa menghapus latar otomatis; foto asli yang dipakai. Coba Chrome versi terbaru.",
      });
      return;
    }
    try {
      const hasil = await hapusLatar(file, (status) => setKeadaan({ tahap: "olah", status }));
      const tanpaLatar: Pilihan = { ...hasil, url: URL.createObjectURL(hasil.file) };
      setFile(input, tanpaLatar.file);
      setKeadaan({ tahap: "siap", asli, tanpaLatar, pakai: "tanpaLatar" });
    } catch (err) {
      setFile(input, asli.file);
      setKeadaan({
        tahap: "siap",
        asli,
        tanpaLatar: null,
        pakai: "asli",
        catatan: `Latar belakang tidak bisa dihapus otomatis (${(err as Error).message}). Foto asli yang dipakai; boleh coba foto lain.`,
      });
    }
  }

  function pakai(pilihan: "tanpaLatar" | "asli") {
    if (keadaan.tahap !== "siap" || !inputRef.current) return;
    const p = pilihan === "tanpaLatar" ? keadaan.tanpaLatar : keadaan.asli;
    if (!p) return;
    setFile(inputRef.current, p.file);
    setKeadaan({ ...keadaan, pakai: pilihan });
  }

  function batal() {
    if (inputRef.current) setFile(inputRef.current, null);
    setKeadaan({ tahap: "kosong" });
    setSalah("");
  }

  const dipakai =
    keadaan.tahap === "siap" ? (keadaan.pakai === "tanpaLatar" ? keadaan.tanpaLatar : keadaan.asli) : null;
  const pratinjau: FotoPenceramah | null = dipakai
    ? { url: dipakai.url, lebar: dipakai.lebar ?? 800, tinggi: dipakai.tinggi ?? 1000, latarDihapus: keadaan.tahap === "siap" && keadaan.pakai === "tanpaLatar" }
    : tersimpan;
  const pesanGalat = salah || galat?.[0];
  const status = keadaan.tahap === "olah" ? keadaan.status : null;

  return (
    <fieldset className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200">
      <legend className="sr-only">Foto penceramah</legend>
      <div className="flex gap-4">
        <PanggungPenceramah
          foto={pratinjau}
          nama={nama || "?"}
          sizes="128px"
          kelasInisial="text-2xl"
          className="aspect-[4/5] w-28 shrink-0 rounded-xl sm:w-32"
        >
          {sibuk && (
            <div className="absolute inset-0 grid place-items-center bg-hijau-950/50">
              <span className="size-7 animate-spin rounded-full border-[3px] border-emas-300 border-t-transparent" />
            </div>
          )}
        </PanggungPenceramah>

        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="foto-penceramah" className="block text-sm font-medium text-stone-700">
            Foto penceramah
            {wajib ? <span className="text-red-600"> *</span> : <span className="font-normal text-stone-500"> (opsional)</span>}
          </label>
          <input
            ref={inputRef}
            id="foto-penceramah"
            name="foto"
            type="file"
            accept={ACCEPT_FOTO}
            required={wajib}
            disabled={sibuk}
            onChange={saatPilih}
            aria-invalid={pesanGalat ? true : undefined}
            aria-describedby="foto-penceramah-info"
            className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-hijau-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hijau-700 disabled:opacity-60"
          />
          <input
            type="hidden"
            name="latarDihapus"
            value={keadaan.tahap === "siap" && keadaan.pakai === "tanpaLatar" ? "1" : "0"}
          />

          <div id="foto-penceramah-info" aria-live="polite" className="text-xs">
            {sibuk ? (
              status?.tahap === "unduh" ? (
                <div>
                  <p className="text-stone-600">
                    Menyiapkan penghapus latar ({Math.round(status.mb)} MB, hanya sekali)… {status.persen}%
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-hijau-600 transition-[width]" style={{ width: `${status.persen}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-stone-600">Menghapus latar belakang foto…</p>
              )
            ) : pesanGalat ? (
              <p className="flex items-start gap-1.5 text-red-700">
                <IkonPeringatan className="mt-px size-3.5 shrink-0" /> {pesanGalat}
              </p>
            ) : keadaan.tahap === "siap" ? (
              keadaan.catatan ? (
                <p className="flex items-start gap-1.5 text-emas-700">
                  <IkonPeringatan className="mt-px size-3.5 shrink-0" /> {keadaan.catatan}
                </p>
              ) : (
                <p className="flex items-start gap-1.5 text-hijau-800">
                  <IkonCentang className="mt-px size-3.5 shrink-0" /> Latar belakang sudah dihapus. Periksa pratinjaunya.
                </p>
              )
            ) : tersimpan ? (
              <p className="text-stone-500">Foto sudah tersimpan dan dipakai otomatis. Pilih foto baru untuk menggantinya.</p>
            ) : (
              <p className="text-stone-500">Cukup foto orangnya (JPG/PNG/WEBP); latar belakang dihapus otomatis.</p>
            )}
          </div>

          {keadaan.tahap === "siap" && (
            <div className="flex flex-wrap items-center gap-2">
              {keadaan.tanpaLatar && (
                <div className="inline-grid grid-cols-2 gap-1 rounded-lg bg-white p-0.5 text-xs font-semibold ring-1 ring-stone-200">
                  {(
                    [
                      ["tanpaLatar", "Tanpa latar"],
                      ["asli", "Foto asli"],
                    ] as const
                  ).map(([nilai, label]) => (
                    <button
                      key={nilai}
                      type="button"
                      aria-pressed={keadaan.pakai === nilai}
                      onClick={() => pakai(nilai)}
                      className={`rounded-md px-2.5 py-1 transition ${
                        keadaan.pakai === nilai ? "bg-hijau-800 text-white" : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={batal} className="text-xs font-semibold text-stone-500 hover:text-red-700">
                Batal pilih
              </button>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
