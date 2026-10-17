"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { adzanJatuhTempo, type FaseTv } from "@/lib/layar-tv";
import type { SetelanTv } from "@/lib/schemas";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";

/**
 * Suara adzan di layar TV.
 *
 * Browser hanya mengizinkan suara setelah ada sentuhan/klik/tombol dari
 * pengguna (kebijakan autoplay). Izin dicek saat halaman dibuka; bila belum
 * diizinkan, layar menampilkan pengingat sampai ada klik/tombol, dan izin itu
 * berlaku sampai halaman dimuat ulang.
 */

export type IzinSuara = "cek" | "boleh" | "diblokir";

let izin: IzinSuara = "cek";
let sudahDideteksi = false;
const pendengar = new Set<() => void>();

function setelIzin(baru: IzinSuara) {
  if (izin === baru) return;
  izin = baru;
  pendengar.forEach((f) => f());
}

/**
 * Apakah browser sudah menerima interaksi pengguna (klik/tombol) di halaman ini.
 * Tidak semua tombol dihitung (mis. Esc), dan sentuhan baru dihitung saat jari diangkat.
 */
function sudahAdaAktivasi(): boolean {
  const aktivasi = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return aktivasi ? aktivasi.hasBeenActive : true;
}

function deteksiIzin() {
  if (sudahDideteksi) return;
  sudahDideteksi = true;
  try {
    const nav = navigator as Navigator & { getAutoplayPolicy?: (jenis: string) => string };
    const kebijakan = nav.getAutoplayPolicy?.("mediaelement");
    if (kebijakan) {
      setelIzin(kebijakan === "allowed" ? "boleh" : "diblokir");
    } else {
      // AudioContext mengikuti kebijakan autoplay yang sama: "running" berarti suara diizinkan.
      const konteks = new AudioContext();
      setelIzin(konteks.state === "running" ? "boleh" : "diblokir");
      void konteks.close().catch(() => {});
    }
  } catch {
    setelIzin("diblokir");
  }

  // Klik/tombol dari pengguna mengizinkan suara untuk seluruh halaman (aktivasi pengguna
  // bersifat menetap). Pendengar tetap terpasang: bila suara ternyata masih ditolak,
  // interaksi berikutnya mencoba lagi.
  const buka = () => {
    if (izin !== "boleh" && sudahAdaAktivasi()) setelIzin("boleh");
  };
  for (const jenis of ["pointerdown", "pointerup", "keydown"]) window.addEventListener(jenis, buka, true);
}

function berlangganan(f: () => void) {
  pendengar.add(f);
  deteksiIzin();
  return () => {
    pendengar.delete(f);
  };
}

export function useIzinSuara(): IzinSuara {
  return useSyncExternalStore(
    berlangganan,
    () => izin,
    () => "cek",
  );
}

export type AdzanTv = { umum: string | null; subuh: string | null };

/** Memutar dari awal dengan volume tertentu (0–100). */
function putarDariAwal(a: HTMLAudioElement, volume: number): Promise<void> {
  a.volume = volume / 100;
  a.currentTime = 0;
  return a.play();
}

function buatPemutar(url: string | null): HTMLAudioElement | null {
  if (!url) return null;
  const a = new Audio(url);
  a.preload = "auto";
  return a;
}

export function useSuaraAdzan({
  adzan,
  setelan,
  jadwal,
  tanggal,
  sekarang,
  fase,
}: {
  adzan: AdzanTv;
  setelan: SetelanTv;
  jadwal: JadwalHarian;
  tanggal: string;
  sekarang: number | null;
  fase: FaseTv | null;
}) {
  const izinSuara = useIzinSuara();
  const pemutar = useRef<{ umum: HTMLAudioElement | null; subuh: HTMLAudioElement | null }>({ umum: null, subuh: null });
  const [diputar, setDiputar] = useState<{ label: string; uji: boolean } | null>(null);
  const aktif = useRef<HTMLAudioElement | null>(null);
  const sudahDiputar = useRef<string | null>(null);
  const sedangDicoba = useRef<string | null>(null);
  const gagalSaatDiblokir = useRef<string | null>(null);

  useEffect(() => {
    const umum = buatPemutar(adzan.umum);
    const subuh = buatPemutar(adzan.subuh);
    pemutar.current = { umum, subuh };
    // Hanya pemutar yang sedang dipakai yang mengubah status (bukan saat "dipancing" tanpa suara).
    const berhenti = (e: Event) => {
      if (e.currentTarget !== aktif.current) return;
      aktif.current = null;
      setDiputar(null);
    };
    for (const a of [umum, subuh]) {
      if (!a) continue;
      a.addEventListener("ended", berhenti);
      a.addEventListener("pause", berhenti);
    }
    return () => {
      for (const a of [umum, subuh]) {
        if (!a) continue;
        a.removeEventListener("ended", berhenti);
        a.removeEventListener("pause", berhenti);
        a.pause();
      }
      // File diganti/dihapus admin saat sedang diputar: status "berkumandang" ikut dihentikan.
      if (aktif.current && (aktif.current === umum || aktif.current === subuh)) {
        aktif.current = null;
        setDiputar(null);
      }
    };
  }, [adzan.umum, adzan.subuh]);

  const tempo = sekarang === null ? null : adzanJatuhTempo(sekarang, jadwal, setelan);
  const kunciTempo = tempo ? `${tanggal}-${tempo.kunci}` : null;
  const labelTempo = tempo?.label ?? "";
  const subuhTempo = tempo?.kunci === "subuh";

  useEffect(() => {
    if (!kunciTempo || izinSuara === "cek") return;
    if (sudahDiputar.current === kunciTempo || sedangDicoba.current === kunciTempo) return;
    if (izinSuara === "diblokir" && gagalSaatDiblokir.current === kunciTempo) return;
    const utama = (subuhTempo ? pemutar.current.subuh : null) ?? pemutar.current.umum;
    if (!utama) return;
    const cadangan = utama === pemutar.current.umum ? null : pemutar.current.umum;
    sedangDicoba.current = kunciTempo;
    const coba = (a: HTMLAudioElement): Promise<HTMLAudioElement> =>
      putarDariAwal(a, setelan.volumeAdzan).then(() => a);
    coba(utama)
      // File Subuh tidak bisa diputar di perangkat ini (mis. format tidak didukung): pakai adzan biasa.
      .catch((err: unknown) => {
        if ((err as Error)?.name === "NotAllowedError" || !cadangan) throw err;
        return coba(cadangan);
      })
      .then((a) => {
        sudahDiputar.current = kunciTempo;
        aktif.current = a;
        setelIzin("boleh");
        setDiputar({ label: labelTempo, uji: false });
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === "NotAllowedError") {
          gagalSaatDiblokir.current = kunciTempo;
          setelIzin("diblokir");
        } else {
          console.warn("[layar-tv] Suara adzan tidak dapat diputar:", (err as Error)?.message);
        }
      })
      .finally(() => {
        sedangDicoba.current = null;
      });
  }, [kunciTempo, labelTempo, subuhTempo, izinSuara, setelan.volumeAdzan]);

  // Adzan dihentikan begitu sholat berjamaah dimulai.
  const sholatDimulai = fase?.jenis === "sholat";
  useEffect(() => {
    if (!sholatDimulai) return;
    pemutar.current.umum?.pause();
    pemutar.current.subuh?.pause();
  }, [sholatDimulai]);

  const uji = useCallback(() => {
    if (aktif.current) {
      aktif.current.pause();
      return;
    }
    const a = pemutar.current.umum ?? pemutar.current.subuh;
    if (!a) return;
    putarDariAwal(a, setelan.volumeAdzan)
      .then(() => {
        aktif.current = a;
        setelIzin("boleh");
        setDiputar({ label: "", uji: true });
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === "NotAllowedError") setelIzin("diblokir");
      });
  }, [setelan.volumeAdzan]);

  const adaFile = Boolean(adzan.umum || adzan.subuh);
  const adaWaktuAktif =
    setelan.adzanSubuh ||
    setelan.adzanDzuhur ||
    setelan.adzanAshar ||
    setelan.adzanMaghrib ||
    setelan.adzanIsya ||
    setelan.adzanJumat;

  return {
    izin: izinSuara,
    /** Adzan (bukan tes) yang sedang berbunyi. */
    adzanBerkumandang: diputar && !diputar.uji ? diputar.label : null,
    sedangUji: Boolean(diputar?.uji),
    adaFile,
    perluIzin: izinSuara === "diblokir" && adaFile && adaWaktuAktif,
    uji,
  };
}
