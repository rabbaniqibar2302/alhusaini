import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { IkonGembok, IkonMasjid } from "@/components/ikon";
import { totpAktif } from "@/server/auth/kredensial";
import { bacaSesi } from "@/server/auth/sesi";
import { bacaIdentitas } from "@/server/identitas";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Login" };

// Halaman login memeriksa sesi (cookie) dan pesan di URL sebelum tampil.
export const instant = false;

async function sudahLogin(): Promise<boolean> {
  try {
    return (await bacaSesi()) !== null;
  } catch (err) {
    unstable_rethrow(err);
    return false;
  }
}

export default async function HalamanLogin({ searchParams }: PageProps<"/admin/login">) {
  if (await sudahLogin()) redirect("/admin");
  const [sp, { nama }] = await Promise.all([searchParams, bacaIdentitas()]);
  const info =
    sp.keluar === "1"
      ? "Anda telah keluar. Sampai jumpa!"
      : sp.sesi === "berakhir"
        ? "Sesi Anda telah berakhir. Silakan login kembali."
        : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hijau-900 text-emas-300">
            <IkonMasjid className="size-8" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-hijau-900">Panel Admin</h1>
          <p className="text-sm text-stone-600">{nama}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
          {info && <p className="mb-4 rounded-xl bg-hijau-50 px-3 py-2.5 text-sm text-hijau-800 ring-1 ring-hijau-200">{info}</p>}
          <FormLogin totpAktif={totpAktif()} />
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500">
          <IkonGembok className="size-3.5" /> Hanya untuk pengurus masjid.
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/" className="text-hijau-800 underline-offset-2 hover:underline">
            ← Kembali ke halaman depan
          </Link>
        </p>
      </div>
    </main>
  );
}
