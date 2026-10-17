import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { originSama } from "@/lib/origin";
import { AudioTidakValid } from "../audio-adzan";
import { RedisBelumDikonfigurasi } from "../redis";
import { TAG_KONTEN } from "../store";
import { FotoTidakValid } from "../unggah-foto";
import { bacaSesi, type SesiAdmin } from "./sesi";

/**
 * Penjaga di sisi server. Proxy hanya pemeriksaan awal; setiap halaman admin
 * dan setiap server action yang mengubah data wajib lolos pemeriksaan di sini.
 */

export async function infoPermintaan() {
  const h = await headers();
  const ip = (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  return {
    ip: ip || "tidak-diketahui",
    userAgent: h.get("user-agent") ?? "",
    originValid: originSama(h.get("origin"), h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto")),
  };
}

/** Untuk halaman admin: alihkan ke login bila sesi tidak valid. */
export async function wajibAdminHalaman(): Promise<SesiAdmin> {
  const sesi = await bacaSesi();
  if (!sesi) redirect("/admin/login");
  return sesi;
}

/**
 * Untuk setiap server action yang mengubah data: cek Origin (CSRF) dan sesi
 * di server, lalu jalankan aksi dengan penanganan galat yang aman (pesan
 * internal tidak dikirim ke browser).
 */
export async function jalankanAksiAdmin(aksi: (sesi: SesiAdmin) => Promise<HasilAksi>): Promise<HasilAksi> {
  try {
    const { originValid } = await infoPermintaan();
    if (!originValid) {
      return { ok: false, pesan: "Permintaan ditolak: asal permintaan (Origin) tidak valid." };
    }
    const sesi = await bacaSesi();
    if (!sesi) redirect("/admin/login?sesi=berakhir");
    const hasil = await aksi(sesi);
    return { ...hasil, kunci: Date.now() };
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof FotoTidakValid || err instanceof AudioTidakValid || err instanceof RedisBelumDikonfigurasi) {
      return { ok: false, pesan: err.message, kunci: Date.now() };
    }
    console.error("[aksi-admin] Gagal:", err);
    return { ok: false, pesan: "Terjadi kesalahan di server. Silakan coba lagi.", kunci: Date.now() };
  }
}

export function hasilValidasiGagal(error: z.ZodError): HasilAksi {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return {
    ok: false,
    pesan: formErrors[0] ?? "Periksa kembali isian yang ditandai.",
    galat: fieldErrors as Record<string, string[] | undefined>,
  };
}

const HALAMAN_PUBLIK = ["/", "/kegiatan", "/sejarah", "/tv"] as const;

/** Segarkan cache halaman publik (termasuk layar TV) supaya perubahan langsung tampil. */
export function segarkanHalamanPublik(): void {
  updateTag(TAG_KONTEN);
  for (const jalur of HALAMAN_PUBLIK) revalidatePath(jalur);
}
