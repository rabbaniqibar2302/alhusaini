import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import type { CSSProperties } from "react";
import { deskripsiSitus, namaDenganWilayah } from "@/lib/site";
import { TEMA, variabelTema, warna } from "@/lib/tema";
import { bacaIdentitas } from "@/server/identitas";
import { urlSitus } from "@/server/situs";
import { bacaTema } from "@/server/tampilan";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const URL_SITUS = urlSitus();

/** Nama & deskripsi mengikuti identitas masjid yang diatur admin (di-cache, diperbarui saat disimpan). */
export async function generateMetadata(): Promise<Metadata> {
  const identitas = await bacaIdentitas();
  const deskripsi = deskripsiSitus(identitas);
  return {
    metadataBase: URL_SITUS,
    title: {
      default: namaDenganWilayah(identitas, " — "),
      template: `%s | ${identitas.nama}`,
    },
    description: deskripsi,
    applicationName: identitas.nama,
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: identitas.nama,
      title: identitas.nama,
      description: deskripsi,
    },
    formatDetection: { telephone: false },
  };
}

/** Warna bilah browser HP mengikuti tema (sama dengan header situs). */
export async function generateViewport(): Promise<Viewport> {
  const tema = await bacaTema();
  return {
    themeColor: warna(TEMA[tema], "utama", 950),
    width: "device-width",
    initialScale: 1,
    // Navigasi bawah memakai env(safe-area-inset-bottom) di iPhone berponi.
    viewportFit: "cover",
  };
}

/** Tema warna pilihan pengurus mengisi variabel CSS warna di elemen <html>. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = await bacaTema();
  return (
    <html
      lang="id"
      data-tema={tema}
      style={variabelTema(tema) as CSSProperties}
      className={`${jakarta.variable} ${amiri.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
