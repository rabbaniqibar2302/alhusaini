"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as PointerEventReact, type ReactNode } from "react";
import {
  IkonAmbulans,
  IkonBeranda,
  IkonBuku,
  IkonBulanSabit,
  IkonDompet,
  IkonGrafik,
  IkonJam,
  IkonKalender,
  IkonMasjid,
  IkonMenu,
  IkonMikrofon,
  IkonPengumuman,
  IkonPerisai,
  IkonPin,
  IkonSejarah,
  IkonSilang,
  IkonTelepon,
  IkonWhatsApp,
} from "@/components/ikon";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import { useSekarang } from "@/hooks/use-sekarang";
import { sholatBerikutnya } from "@/lib/sholat-berikutnya";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";

const IKON = {
  beranda: IkonBeranda,
  sholat: IkonJam,
  sholatKhusus: IkonBulanSabit,
  agenda: IkonKalender,
  hariBesar: IkonBulanSabit,
  khotib: IkonMikrofon,
  kajian: IkonBuku,
  kegiatan: IkonKalender,
  infak: IkonDompet,
  kas: IkonGrafik,
  ambulans: IkonAmbulans,
  sejarah: IkonSejarah,
  legalitas: IkonPerisai,
  kontak: IkonTelepon,
  pengumuman: IkonPengumuman,
} as const;

export type KunciIkonNav = keyof typeof IKON;

export type TautanNav = {
  /** Id bagian di halaman depan, mis. "kajian" (tautan: /#kajian). */
  id: string;
  label: string;
  ikon: KunciIkonNav;
};

/** Tombol cepat di lembar menu HP (WhatsApp, telepon, peta). */
export type AksiCepat = { label: string; href: string; ikon: "whatsapp" | "telepon" | "peta" };

const IKON_AKSI = { whatsapp: IkonWhatsApp, telepon: IkonTelepon, peta: IkonPin } as const;

/**
 * Bagian halaman yang sedang dibaca (scrollspy): bagian yang memotong pita
 * tipis di tengah layar.
 */
function useBagianAktif(ids: readonly string[]): string | null {
  const [aktif, setAktif] = useState<string | null>(null);
  const kunci = ids.join(" ");

  useEffect(() => {
    const elemen = kunci
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elemen.length === 0 || !("IntersectionObserver" in window)) return;
    const memotong = new Set<string>();
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (e.isIntersecting) memotong.add(e.target.id);
          else memotong.delete(e.target.id);
        }
        const pertama = elemen.find((el) => memotong.has(el.id));
        if (pertama) setAktif(pertama.id);
      },
      { rootMargin: "-42% 0px -52% 0px" },
    );
    elemen.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [kunci]);

  return aktif;
}

/* ------------------------------- Desktop ------------------------------- */

export function NavDesktop({ tautan }: { tautan: TautanNav[] }) {
  const aktif = useBagianAktif(tautan.map((t) => t.id));
  return (
    <nav aria-label="Navigasi bagian halaman" className="hidden min-w-0 lg:block">
      <ul className="flex gap-0.5 overflow-x-auto text-sm whitespace-nowrap [scrollbar-width:none]">
        {tautan.map((t) => {
          const ini = t.id === aktif;
          return (
            <li key={t.id}>
              <Link
                href={`/#${t.id}`}
                aria-current={ini ? "location" : undefined}
                className={`relative inline-block rounded-full px-2.5 py-1.5 transition after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-aksen-400 after:transition after:duration-300 ${
                  ini ? "bg-white/10 text-white after:scale-x-100" : "text-utama-100 after:scale-x-0 hover:bg-white/5 hover:text-white"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------------------------------- HP ---------------------------------- */

function TombolTab({
  href,
  label,
  ikon,
  aktif,
}: {
  href: string;
  label: string;
  ikon: ReactNode;
  aktif: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={aktif ? "location" : undefined}
      className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-medium"
    >
      <span
        className={`grid h-8 w-13 place-items-center rounded-full transition duration-300 ${
          aktif ? "bg-aksen-400 text-utama-950" : "text-utama-100 group-active:bg-white/10"
        }`}
      >
        {ikon}
      </span>
      <span className={aktif ? "font-semibold text-white" : "text-utama-100"}>{label}</span>
    </Link>
  );
}

/**
 * Navigasi bawah untuk HP: mudah dijangkau jempol. Tombol tengah menuju jadwal
 * sholat dan menampilkan jam sholat berikutnya; "Menu" membuka lembar berisi
 * semua bagian halaman beserta kontak cepat.
 */
export function NavigasiBawah({
  tab,
  menu,
  aksi,
  nama,
  logo,
  jadwal,
  aktifTetap,
}: {
  /** Dua tab kiri dan satu tab kanan (selain tombol sholat & menu). */
  tab: [TautanNav, TautanNav, TautanNav];
  menu: TautanNav[];
  aksi: AksiCepat[];
  nama: string;
  logo: LogoTampil | null;
  /** Jadwal sholat hari ini & besok; null di halaman yang tidak memuatnya. */
  jadwal: JadwalHarian[] | null;
  /** Bagian yang selalu ditandai aktif, mis. "kegiatan" di halaman /kegiatan. */
  aktifTetap?: string;
}) {
  const [kiri1, kiri2, kanan] = tab;
  const lembar = useRef<HTMLDialogElement>(null);
  const tarik = useRef<{ y: number; jarak: number } | null>(null);
  const sekarang = useSekarang();
  const terlihat = useBagianAktif([kiri1.id, ...menu.map((m) => m.id)]);
  const aktif = aktifTetap ?? terlihat;

  const berikutnya = jadwal && sekarang !== null ? sholatBerikutnya(jadwal, sekarang) : null;
  const sebentarLagi = berikutnya !== null && sekarang !== null && berikutnya.epoch - sekarang <= 15 * 60 * 1000;

  // Tab dianggap aktif juga untuk bagian yang berkaitan (mis. Kajian untuk Khotib Jumat).
  const KELOMPOK: Record<string, string[]> = {
    "jadwal-sholat": ["jadwal-sholat", "sholat-khusus", "hari-besar"],
    kajian: ["kajian", "khotib"],
    infak: ["infak", "kas"],
  };
  const tabAktif = (id: string) => aktif !== null && (KELOMPOK[id] ?? [id]).includes(aktif);

  const buka = () => lembar.current?.showModal();

  /** Tutup dengan animasi (tombol Tutup, latar, geser ke bawah, Esc). */
  const tutup = () => {
    const d = lembar.current;
    if (!d?.open || d.hasAttribute("data-menutup")) return;
    d.style.translate = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      d.close();
      return;
    }
    d.setAttribute("data-menutup", "");
    d.addEventListener(
      "animationend",
      () => {
        d.removeAttribute("data-menutup");
        d.close();
      },
      { once: true },
    );
  };

  /** Tautan bagian: tutup seketika supaya halaman bisa langsung bergulir. */
  const tutupSeketika = () => {
    const d = lembar.current;
    if (!d) return;
    d.removeAttribute("data-menutup");
    d.style.translate = "";
    d.close();
  };

  // Geser pegangan lembar ke bawah untuk menutup.
  const mulaiTarik = (e: PointerEventReact<HTMLElement>) => {
    tarik.current = { y: e.clientY, jarak: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const saatTarik = (e: PointerEventReact<HTMLElement>) => {
    const t = tarik.current;
    const d = lembar.current;
    if (!t || !d) return;
    t.jarak = Math.max(0, e.clientY - t.y);
    d.style.translate = `0 ${t.jarak}px`;
  };
  const akhiriTarik = () => {
    const t = tarik.current;
    tarik.current = null;
    if (!t) return;
    if (t.jarak > 80) tutup();
    else if (lembar.current) lembar.current.style.translate = "";
  };

  // Lembar ditutup otomatis bila layar dibesarkan melewati ukuran HP.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const ubah = () => {
      if (mq.matches && lembar.current?.open) lembar.current.close();
    };
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);

  const ikonTab = (k: KunciIkonNav) => {
    const I = IKON[k];
    return <I className="size-5" />;
  };

  return (
    <>
      <nav
        id="navigasi-bawah"
        aria-label="Navigasi utama"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <ul className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 items-end rounded-[1.75rem] bg-utama-950/92 p-1.5 shadow-[0_12px_40px_-8px_rgb(0_0_0/0.45)] ring-1 ring-white/10 backdrop-blur-xl">
          <li>
            <TombolTab href={`/#${kiri1.id}`} label={kiri1.label} ikon={ikonTab(kiri1.ikon)} aktif={tabAktif(kiri1.id)} />
          </li>
          <li>
            <TombolTab href={`/#${kiri2.id}`} label={kiri2.label} ikon={ikonTab(kiri2.ikon)} aktif={tabAktif(kiri2.id)} />
          </li>
          <li className="flex justify-center">
            <Link
              href="/#jadwal-sholat"
              aria-current={tabAktif("jadwal-sholat") ? "location" : undefined}
              aria-label={berikutnya ? `Jadwal sholat. Berikutnya ${berikutnya.label} pukul ${berikutnya.jam}` : "Jadwal sholat"}
              className="-mt-7 flex flex-col items-center gap-1 text-[0.68rem] font-semibold text-white"
            >
              <span className="relative grid size-15 place-items-center rounded-full bg-linear-to-b from-aksen-300 to-aksen-500 text-utama-950 shadow-lg shadow-black/30 ring-4 ring-utama-950">
                {sebentarLagi && (
                  <span className="absolute inset-0 rounded-full bg-aksen-300/70 motion-safe:animate-ping" aria-hidden="true" />
                )}
                {berikutnya ? (
                  <span className="relative text-[0.95rem] font-extrabold tracking-tight tabular-nums">{berikutnya.jam}</span>
                ) : (
                  <IkonMasjid className="relative size-7" />
                )}
              </span>
              <span>{berikutnya ? berikutnya.label : "Sholat"}</span>
            </Link>
          </li>
          <li>
            <TombolTab href={`/#${kanan.id}`} label={kanan.label} ikon={ikonTab(kanan.ikon)} aktif={tabAktif(kanan.id)} />
          </li>
          <li>
            <button
              type="button"
              onClick={buka}
              aria-haspopup="dialog"
              className="group flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-medium text-utama-100"
            >
              <span className="grid h-8 w-13 place-items-center rounded-full transition group-active:bg-white/10">
                <IkonMenu className="size-5" />
              </span>
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={lembar}
        aria-labelledby="judul-menu-hp"
        onCancel={(e) => {
          e.preventDefault();
          tutup();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) tutup();
        }}
        className="lembar-bawah mx-0 mt-auto mb-0 max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-[1.75rem] bg-white p-0 text-stone-800 shadow-2xl lg:hidden"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div
            onPointerDown={mulaiTarik}
            onPointerMove={saatTarik}
            onPointerUp={akhiriTarik}
            onPointerCancel={akhiriTarik}
            className="shrink-0 cursor-grab touch-none px-5 pt-2.5 pb-3"
          >
            <span className="mx-auto block h-1.5 w-11 rounded-full bg-stone-300" aria-hidden="true" />
            <div className="mt-3 flex items-center gap-3">
              <LogoMasjid logo={logo} nama={nama} className="size-10" />
              <div className="min-w-0">
                <p id="judul-menu-hp" className="truncate font-bold text-utama-900">
                  {nama}
                </p>
                <p className="text-xs text-stone-500">Pilih bagian yang ingin dilihat</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-3">
            <ul className="grid grid-cols-3 gap-2">
              {menu.map((m) => {
                const I = IKON[m.ikon];
                const ini = m.id === aktif;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/#${m.id}`}
                      onClick={tutupSeketika}
                      aria-current={ini ? "location" : undefined}
                      className={`flex h-full min-h-22 flex-col items-center justify-center gap-2 rounded-2xl px-1.5 py-3 text-center text-xs leading-tight font-semibold ring-1 transition active:scale-95 ${
                        ini ? "bg-utama-900 text-white ring-utama-900" : "bg-krem text-utama-900 ring-stone-200/80"
                      }`}
                    >
                      <span
                        className={`grid size-10 place-items-center rounded-xl ${
                          ini ? "bg-aksen-400 text-utama-950" : "bg-utama-900 text-aksen-300"
                        }`}
                      >
                        <I className="size-5" />
                      </span>
                      {m.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {aksi.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {aksi.map((a) => {
                  const I = IKON_AKSI[a.ikon];
                  return (
                    <a
                      key={a.href}
                      href={a.href}
                      {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex flex-1 basis-[30%] items-center justify-center gap-1.5 rounded-full bg-utama-50 px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-utama-800 ring-1 ring-utama-100 active:scale-95"
                    >
                      <I className="size-4" /> {a.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-stone-100 px-4 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={tutup}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 py-3.5 text-sm font-semibold text-stone-700 active:bg-stone-200"
            >
              <IkonSilang className="size-4" /> Tutup
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
