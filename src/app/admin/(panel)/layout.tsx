import Link from "next/link";
import { NavAdmin } from "@/components/admin/nav-admin";
import { IkonKeluar, IkonMasjid, IkonTautanLuar } from "@/components/ikon";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaIdentitas } from "@/server/identitas";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const sesi = await wajibAdminHalaman();
  const { nama } = await bacaIdentitas();

  return (
    <>
      <header className="bg-hijau-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emas-400 text-hijau-950">
              <IkonMasjid className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-bold">Panel Admin</span>
              <span className="block truncate text-xs text-hijau-100">
                {nama} · {sesi.username}
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-hijau-50 ring-1 ring-white/20 hover:bg-white/10 sm:inline-flex"
            >
              <IkonTautanLuar className="size-4" /> Lihat situs
            </a>
            <form method="post" action="/admin/logout">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20"
              >
                <IkonKeluar className="size-4" /> Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 gap-6 px-4 py-5 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:py-8">
        <aside className="mb-5 lg:mb-0">
          <NavAdmin />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}
