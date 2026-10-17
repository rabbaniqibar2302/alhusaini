"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MENU_ADMIN = [
  {
    grup: "Umum",
    item: [
      { href: "/admin", label: "Dasbor" },
      { href: "/admin/pengumuman", label: "Pengumuman" },
    ],
  },
  {
    grup: "Jadwal",
    item: [
      { href: "/admin/khotib", label: "Khotib Jumat" },
      { href: "/admin/pengajian-rabu", label: "Pengajian Rabu" },
      { href: "/admin/kuliah-subuh", label: "Kuliah Subuh" },
      { href: "/admin/pengajian-ibu", label: "Pengajian Ibu" },
      { href: "/admin/hitung-mundur", label: "Hitung Mundur" },
    ],
  },
  {
    grup: "Konten & Foto",
    item: [
      { href: "/admin/kegiatan", label: "Kegiatan Masjid" },
      { href: "/admin/sejarah", label: "Sejarah Masjid" },
      { href: "/admin/foto-masjid", label: "Logo & Foto Masjid" },
      { href: "/admin/galeri", label: "Galeri Ambulans" },
      { href: "/admin/legalitas", label: "Legalitas" },
    ],
  },
  {
    grup: "Pengaturan",
    item: [
      { href: "/admin/tv", label: "Layar TV" },
      { href: "/admin/kontak", label: "Kontak" },
    ],
  },
] as const;

export function NavAdmin() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu admin" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
      <div className="flex gap-1.5 whitespace-nowrap lg:flex-col lg:gap-4">
        {MENU_ADMIN.map((g) => (
          <div key={g.grup} className="contents lg:block">
            <p className="hidden px-3 pb-1 text-[0.7rem] font-semibold tracking-wider text-stone-400 uppercase lg:block">
              {g.grup}
            </p>
            <ul className="contents lg:flex lg:flex-col lg:gap-1">
              {g.item.map((m) => {
                const aktif = pathname === m.href;
                return (
                  <li key={m.href}>
                    <Link
                      href={m.href}
                      aria-current={aktif ? "page" : undefined}
                      className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                        aktif
                          ? "bg-hijau-800 text-white"
                          : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-hijau-50 lg:bg-transparent lg:ring-0"
                      }`}
                    >
                      {m.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
