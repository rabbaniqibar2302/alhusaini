import Link from "next/link";

/** Pita judul untuk halaman publik selain halaman depan. */
export function JudulHalamanPublik({ kicker, judul, subjudul }: { kicker: string; judul: string; subjudul?: string }) {
  const masuk = "motion-safe:animate-naik";
  return (
    <div className="relative isolate overflow-hidden bg-utama-900 text-white">
      <div className="pola-islami pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="latar-kisi pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 -right-32 -z-10 size-[30rem] rounded-full bg-radial from-aksen-400/25 to-transparent to-70% motion-safe:animate-melayang"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <nav aria-label="Remah roti" className={`text-sm text-utama-100 ${masuk}`}>
          <Link href="/" className="underline-offset-2 hover:text-white hover:underline">
            Beranda
          </Link>
          <span className="mx-2 text-aksen-300">/</span>
          <span>{kicker}</span>
        </nav>
        <h1 className={`mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl ${masuk} [animation-delay:80ms]`}>
          {judul}
        </h1>
        {subjudul && <p className={`mt-2 max-w-2xl text-utama-50 ${masuk} [animation-delay:160ms]`}>{subjudul}</p>}
        <div
          className={`mt-4 h-1 w-16 rounded-full bg-linear-to-r from-aksen-400 to-aksen-200 ${masuk} [animation-delay:240ms]`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
