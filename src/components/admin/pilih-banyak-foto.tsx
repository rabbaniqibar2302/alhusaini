"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IkonFoto, IkonSilang } from "@/components/ikon";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { ACCEPT_FOTO, siapkanFoto } from "./foto-klien";

export type FotoTerpilih = { kunci: string; file: File; pratinjau: string; info?: string };

/**
 * Memilih beberapa foto sekaligus (dengan pratinjau). Foto dikirim satu per
 * satu oleh pemanggil lewat `unggahBerurutan`, karena satu request ke server
 * dibatasi 4,5 MB.
 */
export function PilihBanyakFoto({
  id,
  label,
  sisa,
  foto,
  onUbah,
  disabled = false,
}: {
  id: string;
  label: string;
  /** Jumlah foto yang masih boleh ditambahkan. */
  sisa: number;
  foto: FotoTerpilih[];
  onUbah: (foto: FotoTerpilih[]) => void;
  disabled?: boolean;
}) {
  const [pesan, setPesan] = useState<string[]>([]);
  const [memproses, setMemproses] = useState(false);
  const sebelumnya = useRef<FotoTerpilih[]>([]);

  // Lepaskan URL pratinjau yang sudah tidak dipakai.
  useEffect(() => {
    const kini = new Set(foto.map((f) => f.pratinjau));
    for (const f of sebelumnya.current) if (!kini.has(f.pratinjau)) URL.revokeObjectURL(f.pratinjau);
    sebelumnya.current = foto;
  }, [foto]);
  useEffect(() => () => sebelumnya.current.forEach((f) => URL.revokeObjectURL(f.pratinjau)), []);

  async function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;
    setMemproses(true);
    const baru: FotoTerpilih[] = [];
    const galat: string[] = [];
    for (const file of files) {
      if (foto.length + baru.length >= sisa) {
        galat.push(`Maksimal ${sisa} foto lagi; sisa foto tidak dipilih.`);
        break;
      }
      const hasil = await siapkanFoto(file);
      if ("galat" in hasil) {
        galat.push(`${file.name}: ${hasil.galat}`);
      } else {
        baru.push({
          kunci: crypto.randomUUID(),
          file: hasil.file,
          pratinjau: URL.createObjectURL(hasil.file),
          info: hasil.info,
        });
      }
    }
    setMemproses(false);
    setPesan(galat);
    onUbah([...foto, ...baru]);
  }

  const penuh = foto.length >= sisa;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        type="file"
        multiple
        accept={ACCEPT_FOTO}
        onChange={saatPilih}
        disabled={disabled || penuh || memproses}
        aria-describedby={`${id}-info`}
        className="mt-1 block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-hijau-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hijau-700 disabled:opacity-60"
      />
      <p id={`${id}-info`} className="mt-1 text-xs text-stone-500">
        {memproses
          ? "Menyiapkan foto…"
          : penuh
            ? "Jumlah foto sudah maksimal."
            : `Bisa pilih beberapa foto sekaligus (JPG, PNG, WEBP, maks. 5 MB per foto). Sisa: ${sisa - foto.length} foto.`}
      </p>
      {pesan.length > 0 && (
        <ul role="alert" className="mt-2 space-y-0.5 text-xs text-red-700">
          {pesan.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {foto.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {foto.map((f) => (
            <li key={f.kunci} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
              <Image src={f.pratinjau} alt="Pratinjau foto" fill unoptimized className="object-cover" />
              {!disabled && !memproses && (
                <button
                  type="button"
                  onClick={() => onUbah(foto.filter((x) => x.kunci !== f.kunci))}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Batalkan foto ini"
                >
                  <IkonSilang className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {foto.length === 0 && !penuh && (
        <div className="mt-3 hidden items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-4 text-xs text-stone-500 sm:flex">
          <IkonFoto className="size-5 text-stone-400" /> Belum ada foto dipilih.
        </div>
      )}
    </div>
  );
}

type KirimFoto = (file: File) => Promise<HasilAksi | undefined>;

/** Mengirim foto satu per satu; berhenti bila server meminta login ulang. */
export async function unggahBerurutan(
  foto: FotoTerpilih[],
  kirim: KirimFoto,
  onProgres: (ke: number, total: number) => void,
): Promise<{ berhasil: number; gagal: string[] }> {
  let berhasil = 0;
  const gagal: string[] = [];
  for (let i = 0; i < foto.length; i++) {
    onProgres(i + 1, foto.length);
    try {
      const hasil = await kirim(foto[i].file);
      if (!hasil) break; // dialihkan ke halaman login
      if (hasil.ok) berhasil++;
      else gagal.push(`Foto ${i + 1}: ${hasil.pesan}`);
    } catch {
      gagal.push(`Foto ${i + 1}: gagal terhubung ke server.`);
    }
  }
  return { berhasil, gagal };
}

/** Ringkasan hasil unggah untuk ditampilkan ke admin. */
export function pesanUnggah(awalan: string, total: number, hasil: { berhasil: number; gagal: string[] }): HasilAksi {
  if (total === 0) return { ok: true, pesan: awalan };
  if (hasil.gagal.length === 0) return { ok: true, pesan: `${awalan} ${hasil.berhasil} foto diunggah.`.trim() };
  return {
    ok: false,
    pesan: `${awalan} ${hasil.berhasil} dari ${total} foto diunggah. ${hasil.gagal.join(" ")}`.trim(),
  };
}
