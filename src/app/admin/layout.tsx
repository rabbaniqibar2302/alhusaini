import type { Metadata } from "next";

// Area admin selalu dirender per request (membaca cookie sesi), jadi memang
// menunggu server dan tidak divalidasi sebagai statis/instan. Next.js tetap
// memvalidasi perpindahan antarhalaman di bawah layout ini, karena itu setiap
// halaman admin (yang memeriksa sesi sendiri) juga mengekspor `instant = false`.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s | Panel Admin Masjid Al Husaini" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-stone-100">{children}</div>;
}
