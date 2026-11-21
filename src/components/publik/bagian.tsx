import type { ReactNode } from "react";
import { IkonInfo } from "@/components/ikon";

export function Bagian({
  id,
  kicker,
  judul,
  subjudul,
  ikon,
  latar = "putih",
  children,
}: {
  id: string;
  kicker: string;
  judul: string;
  subjudul?: string;
  ikon?: ReactNode;
  latar?: "putih" | "krem";
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className={latar === "krem" ? "bg-krem" : "bg-white"}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <header data-muncul className="mb-6 sm:mb-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-aksen-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-aksen-700 uppercase ring-1 ring-aksen-200/70">
            {ikon}
            {kicker}
          </p>
          <h2 id={`${id}-judul`} className="mt-3 text-2xl font-bold tracking-tight text-utama-900 sm:text-3xl">
            {judul}
          </h2>
          {subjudul && <p className="mt-1.5 max-w-2xl text-stone-600">{subjudul}</p>}
          <div className="garis-judul mt-3 h-1 w-16 rounded-full bg-linear-to-r from-aksen-400 to-aksen-200" aria-hidden="true" />
        </header>
        {children}
      </div>
    </section>
  );
}

export function CatatanContoh() {
  return (
    <p className="flex items-start gap-1.5 px-4 py-3 text-xs text-aksen-700 italic">
      <IkonInfo className="mt-px size-3.5 shrink-0" />
      Data contoh — jadwal ini akan diperbarui oleh pengurus masjid.
    </p>
  );
}

export function InfoKosong({ teks }: { teks: string }) {
  return (
    <p data-muncul className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-6 text-center text-sm text-stone-500">
      {teks}
    </p>
  );
}
