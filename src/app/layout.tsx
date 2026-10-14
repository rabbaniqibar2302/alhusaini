import type { Metadata, Viewport } from "next";
import { Amiri, Plus_Jakarta_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: urlSitus(),
  title: {
    default: `${SITE.nama} — Johar Baru, Jakarta Pusat`,
    template: `%s | ${SITE.nama}`,
  },
  description: SITE.deskripsi,
  applicationName: SITE.nama,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE.nama,
    title: SITE.nama,
    description: SITE.deskripsi,
  },
  formatDetection: { telephone: false },
};

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
