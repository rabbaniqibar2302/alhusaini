"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IkonFoto } from "@/components/ikon";
import { ACCEPT_FOTO, siapkanFoto } from "./foto-klien";

export function InputFoto({
  name = "foto",
  id: idKustom,
  label,
  wajib = false,
  galat,
  petunjuk = "JPG, PNG, atau WEBP, maksimal 5 MB.",
}: {
  name?: string;
  id?: string;
  label: string;
  wajib?: boolean;
  galat?: string[];
  petunjuk?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [salah, setSalah] = useState("");
  const [memproses, setMemproses] = useState(false);
  const id = idKustom ?? `foto-${name}`;

  useEffect(() => {
    return () => {
      if (pratinjau) URL.revokeObjectURL(pratinjau);
    };
  }, [pratinjau]);

  // Bersihkan pratinjau saat form di-reset setelah berhasil disimpan.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const saatReset = () => {
      setPratinjau(null);
      setInfo("");
      setSalah("");
    };
    form.addEventListener("reset", saatReset);
    return () => form.removeEventListener("reset", saatReset);
  }, []);

  async function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    setSalah("");
    setInfo("");
    setPratinjau(null);
    input.setCustomValidity("");
    if (!file) return;

    setMemproses(true);
    input.setCustomValidity("Tunggu, foto sedang diproses.");
    const hasil = await siapkanFoto(file);
    input.setCustomValidity("");
    setMemproses(false);
    if ("galat" in hasil) {
      input.value = "";
      setSalah(hasil.galat);
      return;
    }
    const akhir = hasil.file;
    if (akhir !== file) {
      const dt = new DataTransfer();
      dt.items.add(akhir);
      input.files = dt.files;
    }
    if (hasil.info) setInfo(hasil.info);
    setPratinjau(URL.createObjectURL(akhir));
  }

  const pesanGalat = salah || galat?.[0];

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {wajib && <span className="text-red-600"> *</span>}
      </label>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 sm:w-40">
          {pratinjau ? (
            <Image src={pratinjau} alt="Pratinjau foto" fill unoptimized className="object-cover" />
          ) : (
            <IkonFoto className="size-8 text-stone-400" />
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={ACCEPT_FOTO}
          required={wajib}
          onChange={saatPilih}
          aria-invalid={pesanGalat ? true : undefined}
          aria-describedby={`${id}-info`}
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-hijau-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hijau-700"
        />
      </div>
      <p id={`${id}-info`} className={`mt-1 text-xs ${pesanGalat ? "text-red-700" : "text-stone-500"}`}>
        {memproses ? "Memperkecil foto…" : pesanGalat || info || petunjuk}
      </p>
    </div>
  );
}
