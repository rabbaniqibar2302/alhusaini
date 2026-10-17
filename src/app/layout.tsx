import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import { deskripsiSitus, namaDenganWilayah } from "@/lib/site";
import { bacaIdentitas } from "@/server/identitas";
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

function urlSitus(): URL {
  const dariEnv = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!dariEnv) return new URL("http://localhost:3000");
  return new URL(dariEnv.startsWith("http") ? dariEnv : `https://${dariEnv}`);
}

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

export const viewport: Viewport = {
  themeColor: "#0f3b2c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${amiri.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
