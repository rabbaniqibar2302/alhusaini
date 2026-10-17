"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MENIT = 60_000;

/**
 * Selisih jam perangkat terhadap jam server (ms). Diabaikan bila kurang dari
 * 2 detik supaya detik di layar tidak meloncat-loncat.
 */
export function useSelisihWaktuServer(): number {
  const [selisih, setSelisih] = useState(0);
  useEffect(() => {
    let batal = false;
    async function sinkron() {
      try {
        const t0 = Date.now();
        const res = await fetch("/tv/waktu", { cache: "no-store" });
        const t1 = Date.now();
        if (!res.ok || t1 - t0 > 5000) return;
        const { sekarang } = (await res.json()) as { sekarang?: unknown };
        if (typeof sekarang !== "number" || batal) return;
        const beda = sekarang + (t1 - t0) / 2 - t1;
        setSelisih(Math.abs(beda) >= 2000 ? Math.round(beda) : 0);
      } catch {
        // Tetap memakai jam perangkat.
      }
    }
    void sinkron();
    const t = setInterval(sinkron, 30 * MENIT);
    return () => {
      batal = true;
      clearInterval(t);
    };
  }, []);
  return selisih;
}

/**
 * Data diperbarui otomatis: tiap 5 menit, saat internet tersambung kembali,
 * dan saat data hari ini belum ada. Halaman sengaja tidak dimuat ulang penuh,
 * karena izin suara adzan dari browser hilang setiap kali halaman dimuat ulang.
 */
export function usePembaruanOtomatis(dataUsang: boolean, tanggal: string) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 5 * MENIT);
    const saatOnline = () => router.refresh();
    window.addEventListener("online", saatOnline);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", saatOnline);
    };
  }, [router]);

  useEffect(() => {
    if (dataUsang) router.refresh();
  }, [dataUsang, tanggal, router]);
}

/** Mencegah layar TV mati/redup (Screen Wake Lock API, bila didukung). */
export function useLayarTetapMenyala() {
  useEffect(() => {
    let kunci: WakeLockSentinel | null = null;
    let aktif = true;
    async function minta() {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          kunci = await navigator.wakeLock.request("screen");
          if (!aktif) await kunci.release();
        }
      } catch {
        // Tidak didukung / ditolak: abaikan.
      }
    }
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") void minta();
    };
    void minta();
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      aktif = false;
      document.removeEventListener("visibilitychange", saatTerlihat);
      void kunci?.release().catch(() => {});
    };
  }, []);
}

/** True selama mouse/remote baru saja digerakkan (untuk menampilkan tombol & kursor). */
export function useInteraksiBaru(detik = 4): boolean {
  const [aktif, setAktif] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const tandai = () => {
      setAktif(true);
      clearTimeout(t);
      t = setTimeout(() => setAktif(false), detik * 1000);
    };
    window.addEventListener("pointermove", tandai);
    window.addEventListener("keydown", tandai);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointermove", tandai);
      window.removeEventListener("keydown", tandai);
    };
  }, [detik]);
  return aktif;
}

export function alihkanLayarPenuh() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

/** Tombol F pada keyboard/remote untuk layar penuh. */
export function useTombolLayarPenuh() {
  useEffect(() => {
    const saatTekan = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) alihkanLayarPenuh();
    };
    window.addEventListener("keydown", saatTekan);
    return () => window.removeEventListener("keydown", saatTekan);
  }, []);
}
