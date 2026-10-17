import Link from "next/link";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import type { Identitas } from "@/lib/schemas";

export type BagianOpsional = {
  kegiatan?: boolean;
  sejarah?: boolean;
  agenda?: boolean;
  infak?: boolean;
  kas?: boolean;
};

function navigasi(ada: BagianOpsional): [string, string][] {
  const daftar: [string, string, boolean?][] = [
    ["/#jadwal-sholat", "Jadwal Sholat"],
    ["/#agenda", "Agenda", ada.agenda === true],
    ["/#hari-besar", "Hari Besar"],
    ["/#khotib", "Khotib Jumat"],
    ["/#kajian", "Kajian"],
    ["/#kegiatan", "Kegiatan", ada.kegiatan],
    ["/#infak", "Infak", ada.infak === true],
    ["/#kas", "Laporan Kas", ada.kas === true],
    ["/#ambulans", "Ambulans"],
    ["/#sejarah", "Sejarah", ada.sejarah],
    ["/#legalitas", "Legalitas"],
    ["/#kontak", "Kontak"],
  ];
  return daftar.filter(([, , tampil]) => tampil !== false).map(([href, label]) => [href, label]);
}

export function HeaderSitus({
  identitas,
  logo,
  ada = {},
}: {
  identitas: Pick<Identitas, "nama" | "wilayah">;
  logo: LogoTampil | null;
  ada?: BagianOpsional;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-hijau-950/95 text-white backdrop-blur supports-[backdrop-filter]:bg-hijau-950/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3 pb-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-3">
        <Link href="/#beranda" className="flex shrink-0 items-center gap-2.5">
          <LogoMasjid logo={logo} nama={identitas.nama} priority />
          <span className="leading-tight">
            <span className="block font-bold">{identitas.nama}</span>
            {identitas.wilayah && <span className="block text-xs text-hijau-100">{identitas.wilayah}</span>}
          </span>
        </Link>
        <nav aria-label="Navigasi bagian halaman" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
          <ul className="flex gap-1.5 text-sm whitespace-nowrap lg:gap-1">
            {navigasi(ada).map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-block rounded-full px-3 py-1.5 text-hijau-50 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white lg:px-2.5 lg:ring-0"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
