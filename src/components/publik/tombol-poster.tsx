"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { IkonBagikan, IkonSilang, IkonUnduh } from "@/components/ikon";
import type { TautanPoster } from "@/lib/poster";

type Status = { tahap: "awal" | "memuat" | "gagal" } | { tahap: "siap"; berkas: File; url: string };

/**
 * Tombol "Bagikan poster": membuka pratinjau poster story (dibuat server di
 * /poster/...), lalu membagikannya lewat menu bagikan HP (WhatsApp, dll.)
 * atau mengunduhnya. Gambar diambil sekali saat dialog pertama dibuka, supaya
 * menu bagikan bisa langsung dibuka saat tombol ditekan (syarat Safari iOS).
 */
export function TombolPoster({ poster }: { poster: TautanPoster }) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();
  const [status, setStatus] = useState<Status>({ tahap: "awal" });
  const [bisaBagikan, setBisaBagikan] = useState(false);
  const [pesan, setPesan] = useState("");

  const urlGambar = status.tahap === "siap" ? status.url : null;
  useEffect(
    () => () => {
      if (urlGambar) URL.revokeObjectURL(urlGambar);
    },
    [urlGambar],
  );

  async function muat() {
    setStatus({ tahap: "memuat" });
    try {
      const res = await fetch(poster.href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const berkas = new File([blob], poster.namaBerkas, { type: blob.type || "image/jpeg" });
      setBisaBagikan(typeof navigator.canShare === "function" && navigator.canShare({ files: [berkas] }));
      setStatus({ tahap: "siap", berkas, url: URL.createObjectURL(blob) });
    } catch {
      setStatus({ tahap: "gagal" });
    }
  }

  function buka() {
    setPesan("");
    ref.current?.showModal();
    if (status.tahap === "awal" || status.tahap === "gagal") void muat();
  }

  async function bagikan() {
    if (status.tahap !== "siap") return;
    setPesan("");
    try {
      await navigator.share({ files: [status.berkas], title: poster.judul, text: poster.teks });
    } catch (err) {
      // AbortError: menu bagikan ditutup tanpa memilih aplikasi.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setPesan("Menu bagikan tidak dapat dibuka. Unduh gambarnya, lalu kirim dari WhatsApp.");
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={buka}
        aria-label={poster.label}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hijau-50 px-3 py-2 text-sm font-semibold text-hijau-800 ring-1 ring-hijau-100 transition hover:bg-hijau-100"
      >
        <IkonBagikan className="size-4" /> Bagikan poster
      </button>

      <dialog
        ref={ref}
        aria-labelledby={idJudul}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl bg-white p-0 text-stone-800 shadow-2xl"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={idJudul} className="font-bold text-hijau-900">
                {poster.judul}
              </h2>
              <p className="text-xs text-stone-500">Ukuran story 9:16, siap untuk status WhatsApp.</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Tutup"
              className="-mt-1 -mr-1 rounded-full p-1.5 text-stone-500 hover:bg-stone-100"
            >
              <IkonSilang className="size-5" />
            </button>
          </div>

          <div className="relative mx-auto mt-3 aspect-[9/16] h-[min(58dvh,34rem)] overflow-hidden rounded-2xl bg-hijau-950 ring-1 ring-stone-200">
            {status.tahap === "siap" ? (
              <Image src={status.url} alt={poster.alt} fill unoptimized className="object-contain" />
            ) : status.tahap === "gagal" ? (
              <div className="grid size-full place-items-center p-6 text-center text-sm text-white">
                <div>
                  <p>Poster gagal dimuat. Periksa koneksi internet Anda.</p>
                  <button
                    type="button"
                    onClick={() => void muat()}
                    className="mt-3 rounded-full bg-white px-4 py-1.5 font-semibold text-hijau-900 hover:bg-emas-100"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid size-full place-items-center text-sm text-emas-200" role="status">
                <div className="text-center">
                  <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-emas-300 border-t-transparent" />
                  <p className="mt-3">Menyiapkan poster…</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2">
            {bisaBagikan && (
              <button
                type="button"
                onClick={bagikan}
                disabled={status.tahap !== "siap"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-hijau-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-hijau-700 disabled:opacity-50"
              >
                <IkonBagikan className="size-4" /> Bagikan ke WhatsApp, dll.
              </button>
            )}
            {status.tahap === "siap" ? (
              <a
                href={status.url}
                download={poster.namaBerkas}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  bisaBagikan
                    ? "text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                    : "bg-hijau-800 text-white shadow-sm hover:bg-hijau-700"
                }`}
              >
                <IkonUnduh className="size-4" /> Unduh gambar
              </a>
            ) : (
              <span className="inline-flex cursor-default items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-400 ring-1 ring-stone-200">
                <IkonUnduh className="size-4" /> Unduh gambar
              </span>
            )}
          </div>
          {pesan && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {pesan}
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            {bisaBagikan
              ? "Pilih WhatsApp lalu “Status saya”, atau kirim ke grup dan teman."
              : "Setelah diunduh, buka WhatsApp → Status, lalu pilih gambar ini dari galeri."}
          </p>
        </div>
      </dialog>
    </>
  );
}
