"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { cekBatasLogin, resetBatasLogin } from "@/server/auth/batas-login";
import { kredensialTerkonfigurasi, totpAktif, verifikasiKredensial } from "@/server/auth/kredensial";
import { infoPermintaan } from "@/server/auth/penjaga";
import { buatSesi, cabutSesiDariToken } from "@/server/auth/sesi";
import { NAMA_COOKIE_SESI, rahasiaSesiValid } from "@/server/auth/token";
import { redisTersedia } from "@/server/store";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
  kode: z.string().trim().max(10),
});

export async function login(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  const { ip, userAgent, originValid } = await infoPermintaan();
  if (!originValid) {
    return { ok: false, pesan: "Permintaan ditolak." };
  }
  if (!redisTersedia() || !rahasiaSesiValid() || !kredensialTerkonfigurasi()) {
    console.error(
      "[login] Konfigurasi belum lengkap: periksa Redis, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH.",
    );
    return {
      ok: false,
      pesan: "Login belum dapat digunakan karena konfigurasi server belum lengkap. Hubungi pengelola website.",
    };
  }

  const pesanGagal = totpAktif()
    ? "Username, password, atau kode verifikasi salah."
    : "Username atau password salah.";

  try {
    // Setiap percobaan dihitung sebelum kredensial diperiksa.
    const batas = await cekBatasLogin(ip);
    if (!batas.diizinkan) {
      return {
        ok: false,
        pesan: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${batas.tungguMenit} menit.`,
      };
    }

    const masukan = loginSchema.safeParse({
      username: formData.get("username") ?? "",
      password: formData.get("password") ?? "",
      kode: formData.get("kode") ?? "",
    });
    if (!masukan.success) return { ok: false, pesan: pesanGagal };

    const valid = await verifikasiKredensial({
      username: masukan.data.username,
      password: masukan.data.password,
      kodeTotp: masukan.data.kode,
    });
    if (!valid) return { ok: false, pesan: pesanGagal };

    await resetBatasLogin(ip);
    // Rotasi sesi: cabut sesi lama (jika ada) sebelum membuat sesi baru.
    await cabutSesiDariToken((await cookies()).get(NAMA_COOKIE_SESI)?.value);
    await buatSesi(process.env.ADMIN_USERNAME!.trim(), { ip, userAgent });
  } catch (err) {
    console.error("[login] Gagal memproses login:", err);
    return { ok: false, pesan: "Terjadi kesalahan di server. Silakan coba lagi." };
  }

  redirect("/admin");
}
