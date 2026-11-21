"use client";

import { useEffect } from "react";

/**
 * Penggerak efek halaman publik (tidak merender apa pun):
 * - data-muncul: elemen muncul perlahan saat digulir ke layar. Elemen yang
 *   sudah tampil (atau sudah dilewati) saat skrip mulai tidak dianimasikan,
 *   jadi tidak ada kedip; tanpa JavaScript semuanya tampil biasa.
 * - data-sorot: cahaya kartu mengikuti posisi mouse.
 * Lihat CSS-nya di globals.css.
 */
export function PenggerakAnimasi() {
  useEffect(() => {
    const html = document.documentElement;

    const sorot = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !(e.target instanceof Element)) return;
      const el = e.target.closest<HTMLElement>("[data-sorot]");
      if (!el) return;
      const kotak = el.getBoundingClientRect();
      el.style.setProperty("--sorot-x", `${e.clientX - kotak.left}px`);
      el.style.setProperty("--sorot-y", `${e.clientY - kotak.top}px`);
    };
    document.addEventListener("pointermove", sorot, { passive: true });

    const gerakDikurangi = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (gerakDikurangi || !("IntersectionObserver" in window)) {
      return () => document.removeEventListener("pointermove", sorot);
    }

    const tampilkan = (el: Element) => el.setAttribute("data-terlihat", "");
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (!e.isIntersecting) continue;
          tampilkan(e.target);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const daftarkan = (el: Element) => {
      if (el.hasAttribute("data-terlihat")) return;
      if (el.getBoundingClientRect().top < window.innerHeight) tampilkan(el);
      else io.observe(el);
    };
    const daftarkanSemua = (akar: ParentNode) => akar.querySelectorAll("[data-muncul]").forEach(daftarkan);

    // Konten yang datang belakangan (navigasi antarhalaman, streaming) ikut didaftarkan
    // sebelum digambar browser, jadi yang sudah di layar tidak sempat tersembunyi.
    const mo = new MutationObserver((catatan) => {
      for (const c of catatan) {
        c.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.hasAttribute("data-muncul")) daftarkan(n);
          daftarkanSemua(n);
        });
      }
    });

    daftarkanSemua(document);
    mo.observe(document.body, { childList: true, subtree: true });
    html.setAttribute("data-animasi", "");

    return () => {
      document.removeEventListener("pointermove", sorot);
      io.disconnect();
      mo.disconnect();
      html.removeAttribute("data-animasi");
    };
  }, []);

  return null;
}
