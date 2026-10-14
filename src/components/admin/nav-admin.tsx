"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MENU_ADMIN = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/khotib", label: "Khotib Jumat" },
  { href: "/admin/pengajian-rabu", label: "Pengajian Rabu" },
  { href: "/admin/kuliah-subuh", label: "Kuliah Subuh" },
  { href: "/admin/pengajian-ibu", label: "Pengajian Ibu" },
  { href: "/admin/hitung-mundur", label: "Hitung Mundur" },
  { href: "/admin/foto-masjid", label: "Foto Masjid" },
  { href: "/admin/legalitas", label: "Legalitas" },
  { href: "/admin/galeri", label: "Galeri Ambulans" },
  { href: "/admin/kontak", label: "Kontak" },
] as const;

export function NavAdmin() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu admin" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
      <ul className="flex gap-1.5 whitespace-nowrap lg:flex-col lg:gap-1">
        {MENU_ADMIN.map((m) => {
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
    </nav>
  );
}
