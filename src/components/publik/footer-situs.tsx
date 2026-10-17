import Link from "next/link";
import type { ReactNode } from "react";
import { IkonEmail, IkonInstagram, IkonPin, IkonTautanLuar, IkonTelepon, IkonWhatsApp } from "@/components/ikon";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import { tautanWhatsApp } from "@/lib/kontak";
import type { Kontak } from "@/lib/schemas";
import { MAPS_URL, SITE } from "@/lib/site";

export function FooterSitus({ kontak, tahun, logo }: { kontak: Kontak; tahun: number; logo: LogoTampil | null }) {
  const daftar: { ikon: ReactNode; label: string; href: string }[] = [];
  if (kontak.telepon) {
    daftar.push({
      ikon: <IkonTelepon className="size-5" />,
      label: kontak.telepon,
      href: `tel:${kontak.telepon.replace(/[^0-9+]/g, "")}`,
    });
  }
  if (kontak.whatsapp) {
    daftar.push({
      ikon: <IkonWhatsApp className="size-5" />,
      label: `WhatsApp ${kontak.whatsapp}`,
      href: tautanWhatsApp(kontak.whatsapp),
    });
  }
  if (kontak.email) {
    daftar.push({ ikon: <IkonEmail className="size-5" />, label: kontak.email, href: `mailto:${kontak.email}` });
  }
  if (kontak.instagram) {
    daftar.push({
      ikon: <IkonInstagram className="size-5" />,
      label: `@${kontak.instagram}`,
      href: `https://www.instagram.com/${kontak.instagram}/`,
    });
  }

  return (
    <footer id="kontak" className="relative overflow-hidden bg-hijau-950 text-hijau-50">
      <div className="pola-islami pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-14 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMasjid logo={logo} className="size-12" ikonClassName="size-6" />
            <div>
              <p className="text-lg font-bold text-white">{SITE.nama}</p>
              <p lang="ar" dir="rtl" className="w-fit font-arab text-emas-300">
                {SITE.namaArab}
              </p>
            </div>
          </div>
          <h2 className="mt-6 text-sm font-semibold tracking-wider text-emas-300 uppercase">Alamat</h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed">
            <IkonPin className="mt-0.5 size-5 shrink-0 text-emas-300" />
            {SITE.alamat}
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emas-400 px-4 py-2 text-sm font-semibold text-hijau-950 transition hover:bg-emas-300"
          >
            <IkonTautanLuar className="size-4" /> Buka di Google Maps
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-emas-300 uppercase">Kontak</h2>
          {daftar.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {daftar.map((k) => (
                <li key={k.href}>
                  <a
                    href={k.href}
                    {...(k.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm ring-1 ring-white/10 transition hover:bg-white/10"
                  >
                    <span className="text-emas-300">{k.ikon}</span>
                    <span className="break-all">{k.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-hijau-100">
              Silakan datang langsung ke sekretariat masjid untuk informasi lebih lanjut.
            </p>
          )}
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-hijau-100/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {tahun} {SITE.nama}. Jadwal sholat bersumber dari Kemenag RI melalui API myQuran.
          </p>
          <Link href="/admin" prefetch={false} className="underline-offset-2 hover:text-white hover:underline">
            Login pengurus
          </Link>
        </div>
      </div>
    </footer>
  );
}
