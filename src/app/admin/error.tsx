"use client";

import Link from "next/link";

export default function GalatAdmin({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
        <h1 className="text-lg font-bold text-hijau-900">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-stone-600">
          Permintaan tidak dapat diproses. Sesi Anda mungkin telah berakhir, atau server sedang mengalami gangguan.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-hijau-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hijau-700"
          >
            Coba lagi
          </button>
          <Link
            href="/admin/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-hijau-900 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Login ulang
          </Link>
        </div>
      </div>
    </main>
  );
}
