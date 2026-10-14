"use client";

import { useSyncExternalStore } from "react";

/**
 * Waktu saat ini (epoch ms, dibulatkan ke detik) yang diperbarui tiap detik.
 * Bernilai null saat render server & hidrasi agar HTML server dan browser
 * tetap sama; setelah itu berisi jam perangkat.
 */

const pendengar = new Set<() => void>();
let pewaktu: ReturnType<typeof setInterval> | null = null;

function langganan(panggil: () => void) {
  pendengar.add(panggil);
  pewaktu ??= setInterval(() => pendengar.forEach((f) => f()), 1000);
  return () => {
    pendengar.delete(panggil);
    if (pendengar.size === 0 && pewaktu) {
      clearInterval(pewaktu);
      pewaktu = null;
    }
  };
}

const ambil = () => Math.floor(Date.now() / 1000) * 1000;
const ambilServer = () => null;

export function useSekarang(): number | null {
  return useSyncExternalStore(langganan, ambil, ambilServer);
}
