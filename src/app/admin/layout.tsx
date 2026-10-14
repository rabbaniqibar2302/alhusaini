import type { Metadata } from "next";

// Area admin selalu dirender per request (membaca cookie sesi), jadi tidak
// perlu divalidasi sebagai halaman statis/instan.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s | Panel Admin Masjid Al Husaini" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-stone-100">{children}</div>;
}
