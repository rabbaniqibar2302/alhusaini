"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { IkonFoto } from "@/components/ikon";

const UKURAN_MAKS = 5 * 1024 * 1024;
// Batas body request fungsi Vercel adalah 4,5 MB, jadi foto di atas 4 MB
// diperkecil dulu di browser. Validasi utama tetap dilakukan di server.
const BATAS_KIRIM = 4 * 1024 * 1024;
const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

async function perkecilFoto(file: File): Promise<File> {
  const gambar = await createImageBitmap(file);
  const skala = Math.min(1, 2560 / Math.max(gambar.width, gambar.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(gambar.width * skala);
  kanvas.height = Math.round(gambar.height * skala);
  const ctx = kanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, kanvas.width, kanvas.height);
  ctx.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
  gambar.close();
  for (const kualitas of [0.88, 0.8, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/jpeg", kualitas));
    if (blob && blob.size <= BATAS_KIRIM) {
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
    }
  }
  throw new Error("Foto masih terlalu besar");
}

export function InputFoto({
  name = "foto",
  label,
  wajib = false,
  galat,
  petunjuk = "JPG, PNG, atau WEBP, maksimal 5 MB.",
}: {
  name?: string;
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
  const id = `foto-${name}`;

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

    if (!TIPE_DIIZINKAN.includes(file.type)) {
      input.value = "";
      setSalah("File harus berupa foto JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > UKURAN_MAKS) {
      input.value = "";
      setSalah(`Ukuran foto ${mb(file.size)} melebihi batas 5 MB.`);
      return;
    }

    let akhir = file;
    if (file.size > BATAS_KIRIM) {
      setMemproses(true);
      input.setCustomValidity("Tunggu, foto sedang diproses.");
      try {
        akhir = await perkecilFoto(file);
        const dt = new DataTransfer();
        dt.items.add(akhir);
        input.files = dt.files;
        setInfo(`Foto diperkecil otomatis dari ${mb(file.size)} menjadi ${mb(akhir.size)}.`);
      } catch {
        input.value = "";
        setSalah("Foto gagal diperkecil di perangkat ini. Gunakan foto berukuran di bawah 4 MB.");
        return;
      } finally {
        input.setCustomValidity("");
        setMemproses(false);
      }
    }
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
          accept="image/jpeg,image/png,image/webp"
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
