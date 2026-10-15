import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { GeneratorKredensial } from "@/components/admin/generator-kredensial";
import { IkonCentang, IkonInfo, IkonMasjid, IkonPeringatan } from "@/components/ikon";
import { SITE } from "@/lib/site";
import { konfigurasiAdminLengkap } from "@/server/auth/konfigurasi";
import { statusKredensial } from "@/server/auth/kredensial";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { rahasiaSesiValid } from "@/server/auth/token";
import { getRedis } from "@/server/redis";
import { blobTerkonfigurasi } from "@/server/unggah-foto";

export const metadata: Metadata = { title: "Setup Admin" };

async function cekRedis(): Promise<"belum" | "gagal" | "ok"> {
  const redis = getRedis();
  if (!redis) return "belum";
  try {
    const balasan = await Promise.race([
      redis.ping(),
      new Promise<never>((_, tolak) => setTimeout(() => tolak(new Error("timeout")), 4000)),
    ]);
    return balasan === "PONG" ? "ok" : "gagal";
  } catch {
    return "gagal";
  }
}

/**
 * Setup kredensial admin tanpa perlu install apa pun di komputer: hash dan
 * secret dibuat di browser, lalu disalin ke Environment Variables Vercel.
 * Terbuka untuk umum hanya selama kredensial belum lengkap; setelah itu
 * hanya bisa dibuka admin yang sudah login (mis. untuk mengganti password).
 */
export default async function HalamanSetup() {
  await connection();
  const kred = statusKredensial();
  const secretOk = rahasiaSesiValid();
  const lengkap = konfigurasiAdminLengkap();
  // Proxy sudah mengalihkan pengunjung tanpa sesi; pemeriksaan ulang di server.
  if (lengkap) await wajibAdminHalaman();

  const redis = await cekRedis();
  const blob = blobTerkonfigurasi();
  const status = [
    {
      label: "Upstash Redis",
      ok: redis === "ok",
      ket: {
        ok: "Terhubung",
        belum: "Belum dihubungkan (Vercel → Storage → Upstash for Redis)",
        gagal: "Variabel ada, tetapi gagal terhubung — periksa integrasi Upstash",
      }[redis],
    },
    {
      label: "Vercel Blob",
      ok: blob,
      ket: blob ? "Terhubung" : "Belum dihubungkan (Vercel → Storage → Blob, akses Public)",
    },
    { label: "ADMIN_USERNAME", ok: kred.username, ket: kred.username ? "Sudah diisi" : "Belum diisi" },
    {
      label: "ADMIN_PASSWORD_HASH",
      ok: kred.hash === "ok",
      ket: {
        ok: "Sudah diisi (format bcrypt valid)",
        kosong: "Belum diisi",
        "tidak-valid": "Format tidak valid — buat ulang di bawah",
      }[kred.hash],
    },
    { label: "SESSION_SECRET", ok: secretOk, ket: secretOk ? "Sudah diisi" : "Belum diisi atau kurang dari 32 karakter" },
    {
      label: "ADMIN_TOTP_SECRET (opsional)",
      ok: kred.totp === "ok",
      opsional: true,
      ket: { ok: "Aktif", kosong: "Tidak dipakai", "tidak-valid": "Format tidak valid — buat ulang di bawah" }[kred.totp],
    },
  ];

  return (
    <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl space-y-6">
        <header className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hijau-900 text-emas-300">
            <IkonMasjid className="size-8" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-hijau-900 sm:text-2xl">Setup Akun Admin</h1>
          <p className="text-sm text-stone-600">{SITE.nama}</p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
          <h2 className="font-bold text-hijau-900">Status konfigurasi di Vercel</h2>
          <ul className="mt-3 space-y-2.5">
            {status.map((s) => (
              <li key={s.label} className="flex items-start gap-2.5 text-sm">
                {s.ok ? (
                  <IkonCentang className="mt-px size-5 shrink-0 text-hijau-600" />
                ) : s.opsional ? (
                  <IkonInfo className="mt-px size-5 shrink-0 text-stone-400" />
                ) : (
                  <IkonPeringatan className="mt-px size-5 shrink-0 text-emas-600" />
                )}
                <span>
                  <span className="block font-mono text-xs font-semibold text-stone-800">{s.label}</span>
                  <span className="text-stone-600">{s.ket}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-stone-500">
            Status diperbarui setelah Redeploy. Perubahan Environment Variables di Vercel baru berlaku setelah
            deployment ulang.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
          <h2 className="font-bold text-hijau-900">{lengkap ? "Ganti password / aktifkan 2FA" : "Buat kredensial admin"}</h2>
          <p className="mt-1 mb-4 text-sm text-stone-600">
            Isi username dan password yang akan dipakai login. Browser Anda akan membuat isi Environment Variables
            yang tinggal disalin ke Vercel — tanpa perlu install apa pun di komputer.
          </p>
          <GeneratorKredensial />
        </section>

        <p className="text-center text-sm">
          <Link href={lengkap ? "/admin" : "/"} className="text-hijau-800 underline-offset-2 hover:underline">
            ← {lengkap ? "Kembali ke panel admin" : "Kembali ke halaman depan"}
          </Link>
        </p>
      </div>
    </main>
  );
}
