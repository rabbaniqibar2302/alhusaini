"use client";

import { useEffect, useRef, useState } from "react";
import { formatRupiah } from "@/lib/kas";

const DURASI = 1400;

/**
 * Nominal rupiah yang menghitung naik dari nol saat pertama kali digulir ke
 * layar. Bila sudah terlihat sejak awal, atau pengguna memilih mengurangi
 * gerakan, nilainya langsung tampil. Pembaca layar selalu mendapat nilai akhir.
 * Beri `key={nilai}` supaya perubahan nilai memulai ulang komponen.
 */
export function RupiahNaik({ nilai }: { nilai: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [tampil, setTampil] = useState(nilai);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    let bingkai = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const mulai = performance.now();
        const langkah = (t: number) => {
          const p = Math.min(1, (t - mulai) / DURASI);
          setTampil(Math.round(nilai * (1 - (1 - p) ** 3)));
          if (p < 1) bingkai = requestAnimationFrame(langkah);
        };
        bingkai = requestAnimationFrame(langkah);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(bingkai);
    };
  }, [nilai]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">{formatRupiah(tampil)}</span>
      <span className="sr-only">{formatRupiah(nilai)}</span>
    </span>
  );
}
