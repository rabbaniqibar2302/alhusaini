import type { Metadata } from "next";
import { bacaIdentitas } from "@/server/identitas";

// Area admin selalu dirender per request (membaca cookie sesi), jadi memang
// menunggu server dan tidak divalidasi sebagai statis/instan. Next.js tetap
// memvalidasi perpindahan antarhalaman di bawah layout ini, karena itu setiap
// halaman admin (yang memeriksa sesi sendiri) juga mengekspor `instant = false`.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { nama } = await bacaIdentitas();
  return {
    title: { default: "Panel Admin", template: `%s | Panel Admin ${nama}` },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-stone-100">{children}</div>;
}
