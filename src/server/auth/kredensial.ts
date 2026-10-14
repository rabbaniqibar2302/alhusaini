import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import { getRedis } from "../redis";

/**
 * Verifikasi kredensial satu-satunya akun admin dari environment variable:
 * ADMIN_USERNAME, ADMIN_PASSWORD_HASH (bcrypt), dan opsional ADMIN_TOTP_SECRET.
 * Semua pemeriksaan selalu dijalankan agar waktu respons tidak membocorkan
 * bagian mana yang salah.
 */

// Hash bcrypt dari string acak yang sudah dibuang; dipakai bila konfigurasi
// belum lengkap supaya waktu proses tetap sama.
const HASH_PENGGANTI = "$2b$12$Y00diVHNtyTL0jWt5FZ8EewlYknmOqNxV8aG5PB7o8VWMK2U59HsG";
const POLA_BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function hashPasswordAdmin(): string | null {
  // Toleran terhadap "\$" yang ikut tersalin dari format .env.local.
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/\\\$/g, "$");
  if (!hash || !POLA_BCRYPT.test(hash)) return null;
  return hash;
}

function secretTotp(): string | null {
  const s = process.env.ADMIN_TOTP_SECRET?.replace(/\s+/g, "").toUpperCase();
  return s ? s : null;
}

export function totpAktif(): boolean {
  return secretTotp() !== null;
}

export function kredensialTerkonfigurasi(): boolean {
  return Boolean(process.env.ADMIN_USERNAME?.trim()) && hashPasswordAdmin() !== null;
}

function samaWaktuKonstan(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

async function cekTotp(kode: string): Promise<boolean> {
  const secret = secretTotp();
  if (!secret) return true;
  let totp: OTPAuth.TOTP;
  try {
    totp = new OTPAuth.TOTP({
      issuer: "Masjid Al Husaini",
      label: "admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
  } catch {
    console.error("[auth] ADMIN_TOTP_SECRET bukan base32 yang valid.");
    return false;
  }
  if (!/^\d{6}$/.test(kode)) return false;
  const delta = totp.validate({ token: kode, window: 1 });
  if (delta === null) return false;
  // Cegah pemakaian ulang kode yang sama (replay) dalam masa berlakunya.
  const counter = Math.floor(Date.now() / 30_000) + delta;
  const redis = getRedis();
  if (!redis) return false;
  const baru = await redis.set(`totp:terpakai:${counter}`, 1, { nx: true, ex: 120 });
  return baru === "OK";
}

export async function verifikasiKredensial(input: {
  username: string;
  password: string;
  kodeTotp: string;
}): Promise<boolean> {
  const usernameAdmin = process.env.ADMIN_USERNAME?.trim() ?? "";
  const hash = hashPasswordAdmin();
  if (!usernameAdmin || !hash) {
    console.error("[auth] ADMIN_USERNAME atau ADMIN_PASSWORD_HASH belum diisi / format hash bukan bcrypt.");
  }
  const usernameCocok = samaWaktuKonstan(input.username, usernameAdmin);
  const passwordCocok = await bcrypt.compare(input.password, hash ?? HASH_PENGGANTI);
  const totpCocok = await cekTotp(input.kodeTotp);
  return Boolean(usernameAdmin && hash) && usernameCocok && passwordCocok && totpCocok;
}
