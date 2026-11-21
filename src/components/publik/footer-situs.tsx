import Link from "next/link";
import type { ReactNode } from "react";
import { IkonDompet, IkonEmail, IkonInstagram, IkonPin, IkonTautanLuar, IkonTelepon, IkonWhatsApp } from "@/components/ikon";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import { tautanWhatsApp } from "@/lib/kontak";
import type { Identitas, Kontak } from "@/lib/schemas";
import { urlMaps } from "@/lib/site";

export function FooterSitus({
  identitas,
  kontak,
  tahun,
  logo,
  infak = false,
}: {
  identitas: Identitas;
  kontak: Kontak;
  tahun: number;
  logo: LogoTampil | null;
  /** Ada informasi infak di halaman depan (tombol "Salurkan infak"). */
  infak?: boolean;
}) {
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
    <footer id="kontak" className="relative isolate overflow-hidden bg-utama-950 text-utama-50">
      <div className="pola-islami pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
      <div className="latar-kisi pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-radial from-aksen-400/20 to-transparent to-70% motion-safe:animate-melayang"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-16">
        <div
          data-muncul
          className="flex flex-col gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-aksen-300 uppercase">Mari makmurkan masjid</p>
            <p className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl">
              Sampai jumpa di{" "}
              <span className="bg-linear-to-r from-aksen-200 via-aksen-300 to-aksen-400 bg-clip-text text-transparent">
                {identitas.nama}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {infak && (
              <Link
                href="/#infak"
                className="kilau inline-flex grow items-center justify-center gap-2 rounded-full bg-aksen-400 px-5 py-3 text-sm font-semibold sm:grow-0 text-utama-950 shadow-lg shadow-aksen-500/25 transition hover:-translate-y-0.5 hover:bg-aksen-300"
              >
                <IkonDompet className="size-5" /> Salurkan infak
              </Link>
            )}
            {kontak.whatsapp && (
              <a
                href={tautanWhatsApp(kontak.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex grow items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 sm:grow-0 transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <IkonWhatsApp className="size-5" /> Hubungi pengurus
              </a>
            )}
            <a
              href={urlMaps(identitas)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex grow items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 sm:grow-0 ${
                infak
                  ? "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/15"
                  : "kilau bg-aksen-400 text-utama-950 shadow-lg shadow-aksen-500/25 hover:bg-aksen-300"
              }`}
            >
              <IkonPin className="size-5" /> Petunjuk arah
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:py-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMasjid logo={logo} nama={identitas.nama} className="size-12" ikonClassName="size-6" />
            <div>
              <p className="text-lg font-bold text-white">{identitas.nama}</p>
              {identitas.namaArab && (
                <p lang="ar" dir="rtl" className="w-fit font-arab text-aksen-300">
                  {identitas.namaArab}
                </p>
              )}
            </div>
          </div>
          <h2 className="mt-6 text-sm font-semibold tracking-wider text-aksen-300 uppercase">Alamat</h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed">
            <IkonPin className="mt-0.5 size-5 shrink-0 text-aksen-300" />
            {identitas.alamat}
          </p>
          <a
            href={urlMaps(identitas)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15"
          >
            <IkonTautanLuar className="size-4" /> Buka di Google Maps
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-aksen-300 uppercase">Kontak</h2>
          {daftar.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {daftar.map((k) => (
                <li key={k.href}>
                  <a
                    href={k.href}
                    {...(k.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm ring-1 ring-white/10 transition hover:translate-x-0.5 hover:bg-white/10"
                  >
                    <span className="text-aksen-300">{k.ikon}</span>
                    <span className="break-all">{k.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-utama-100">
              Silakan datang langsung ke sekretariat masjid untuk informasi lebih lanjut.
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        {/* Di HP ada ruang untuk navigasi bawah supaya baris terakhir tidak tertutup. */}
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-xs text-utama-100/80 sm:flex-row sm:items-center sm:justify-between lg:pb-5">
          <p>
            © {tahun} {identitas.nama}. Jadwal sholat bersumber dari Kemenag RI melalui API myQuran.
          </p>
          <Link href="/admin" prefetch={false} className="underline-offset-2 hover:text-white hover:underline">
            Login pengurus
          </Link>
        </div>
      </div>
    </footer>
  );
}
