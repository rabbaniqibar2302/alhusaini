import Link from "next/link";
import { IkonMasjid } from "@/components/ikon";

export default function TidakDitemukan() {
  return (
    <main className="flex flex-1 items-center justify-center bg-krem px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hijau-900 text-emas-300">
          <IkonMasjid className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-hijau-900">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-stone-600">Maaf, halaman yang Anda cari tidak tersedia.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-hijau-800 px-5 py-2.5 font-semibold text-white hover:bg-hijau-700"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
