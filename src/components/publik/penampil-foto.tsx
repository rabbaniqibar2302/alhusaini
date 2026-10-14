"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IkonKanan, IkonKiri, IkonSilang } from "@/components/ikon";

export type ItemFoto = {
  id: string;
  url: string;
  lebar: number;
  tinggi: number;
  alt: string;
  keterangan?: string;
};

/** Lightbox berbasis <dialog> bawaan browser (fokus & tombol Esc ditangani browser). */
export function PenampilFoto({
  items,
  indeks,
  onTutup,
  onGanti,
}: {
  items: ItemFoto[];
  indeks: number | null;
  onTutup: () => void;
  onGanti: (i: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [sentuhX, setSentuhX] = useState<number | null>(null);
  const item = indeks === null ? null : items[indeks];
  const banyak = items.length > 1;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);

  const geser = (arah: 1 | -1) => {
    if (indeks === null || !banyak) return;
    onGanti((indeks + arah + items.length) % items.length);
  };

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") geser(1);
        if (e.key === "ArrowLeft") geser(-1);
      }}
      onTouchStart={(e) => setSentuhX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (sentuhX === null) return;
        const dx = e.changedTouches[0].clientX - sentuhX;
        if (Math.abs(dx) > 50) geser(dx < 0 ? 1 : -1);
        setSentuhX(null);
      }}
      aria-label={item?.alt ?? "Foto"}
      className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white"
    >
      {item && (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2.5 hover:bg-black/70"
            aria-label="Tutup"
          >
            <IkonSilang className="size-6" />
          </button>

          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
            <Image
              key={item.id}
              src={item.url}
              alt={item.alt}
              width={item.lebar}
              height={item.tinggi}
              sizes="100vw"
              unoptimized={item.url.endsWith(".svg")}
              className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>

          {(item.keterangan || banyak) && (
            <div className="flex w-full max-w-3xl items-center justify-between gap-3">
              {banyak ? (
                <button
                  type="button"
                  onClick={() => geser(-1)}
                  className="rounded-full bg-white/10 p-2.5 hover:bg-white/20"
                  aria-label="Foto sebelumnya"
                >
                  <IkonKiri className="size-6" />
                </button>
              ) : (
                <span />
              )}
              <p className="flex-1 text-center text-sm sm:text-base">
                {item.keterangan}
                {banyak && (
                  <span className="mt-1 block text-xs text-white/70">
                    {(indeks ?? 0) + 1} / {items.length}
                  </span>
                )}
              </p>
              {banyak ? (
                <button
                  type="button"
                  onClick={() => geser(1)}
                  className="rounded-full bg-white/10 p-2.5 hover:bg-white/20"
                  aria-label="Foto berikutnya"
                >
                  <IkonKanan className="size-6" />
                </button>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
