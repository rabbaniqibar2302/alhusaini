import { IkonMasjid } from "@/components/ikon";
import { SITE } from "@/lib/site";

const NAVIGASI = [
  ["#jadwal-sholat", "Jadwal Sholat"],
  ["#hari-besar", "Hari Besar"],
  ["#khotib", "Khotib Jumat"],
  ["#kajian", "Kajian"],
  ["#legalitas", "Legalitas"],
  ["#ambulans", "Ambulans"],
  ["#kontak", "Kontak"],
] as const;

export function HeaderSitus() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-hijau-950/95 text-white backdrop-blur supports-[backdrop-filter]:bg-hijau-950/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-3 pb-2 lg:flex-row lg:items-center lg:justify-between lg:py-3">
        <a href="#beranda" className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emas-400 text-hijau-950">
            <IkonMasjid className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-bold">{SITE.nama}</span>
            <span className="block text-xs text-hijau-100">Johar Baru, Jakarta Pusat</span>
          </span>
        </a>
        <nav aria-label="Navigasi bagian halaman" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <ul className="flex gap-1.5 text-sm whitespace-nowrap">
            {NAVIGASI.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-block rounded-full px-3 py-1.5 text-hijau-50 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
