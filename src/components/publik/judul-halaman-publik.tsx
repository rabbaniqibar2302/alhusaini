import Link from "next/link";

/** Pita judul untuk halaman publik selain halaman depan. */
export function JudulHalamanPublik({ kicker, judul, subjudul }: { kicker: string; judul: string; subjudul?: string }) {
  return (
    <div className="relative overflow-hidden bg-hijau-900 text-white">
      <div className="pola-islami pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <nav aria-label="Remah roti" className="text-sm text-hijau-100">
          <Link href="/" className="underline-offset-2 hover:text-white hover:underline">
            Beranda
          </Link>
          <span className="mx-2 text-emas-300">/</span>
          <span>{kicker}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{judul}</h1>
        {subjudul && <p className="mt-2 max-w-2xl text-hijau-50">{subjudul}</p>}
        <div className="mt-4 h-1 w-16 rounded-full bg-linear-to-r from-emas-400 to-emas-200" aria-hidden="true" />
      </div>
    </div>
  );
}
