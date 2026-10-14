import "server-only";
import { SignJWT, jwtVerify } from "jose";

/**
 * Token sesi admin: JWT HS256 yang ditandatangani SESSION_SECRET, disimpan di
 * cookie httpOnly + Secure + SameSite=Strict selama 8 jam. Modul ini juga
 * dipakai proxy (pengecekan cepat tanpa Redis); pengecekan penuh (termasuk
 * daftar sesi aktif di Redis) ada di sesi.ts.
 */

export const DURASI_SESI_DETIK = 8 * 60 * 60;

// Prefix __Host- memaksa cookie Secure, Path=/, tanpa Domain (tidak bisa
// ditimpa subdomain). Hanya di production karena localhost memakai http.
export const NAMA_COOKIE_SESI =
  process.env.NODE_ENV === "production" ? "__Host-alhusaini-admin" : "alhusaini-admin";

const PENERBIT = "masjid-al-husaini";
const AUDIENS = "admin-panel";

export function opsiCookieSesi(maxAge: number = DURASI_SESI_DETIK) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

const encoder = new TextEncoder();
let sudahDilaporkan = false;

function rahasiaSesi(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (!sudahDilaporkan) {
      sudahDilaporkan = true;
      console.error("[auth] SESSION_SECRET belum diisi atau kurang dari 32 karakter; login dinonaktifkan.");
    }
    return null;
  }
  return encoder.encode(s);
}

export function rahasiaSesiValid(): boolean {
  const s = process.env.SESSION_SECRET;
  return Boolean(s && s.length >= 32);
}

/**
 * Sidik jari kredensial admin. Bila username, hash password, atau secret TOTP
 * diganti, semua sesi lama otomatis tidak berlaku.
 */
async function versiKredensial(rahasia: Uint8Array): Promise<string> {
  const bahan = [
    process.env.ADMIN_USERNAME ?? "",
    process.env.ADMIN_PASSWORD_HASH ?? "",
    process.env.ADMIN_TOTP_SECRET ?? "",
  ].join("\n");
  const kunci = await crypto.subtle.importKey(
    "raw",
    rahasia as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const tanda = await crypto.subtle.sign("HMAC", kunci, encoder.encode(bahan));
  return Buffer.from(tanda).toString("base64url").slice(0, 22);
}

export type IsiToken = { sid: string; username: string };

export async function buatToken(sid: string, username: string): Promise<string> {
  const rahasia = rahasiaSesi();
  if (!rahasia) throw new Error("SESSION_SECRET tidak valid");
  return new SignJWT({ sid, cv: await versiKredensial(rahasia) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(username)
    .setIssuer(PENERBIT)
    .setAudience(AUDIENS)
    .setIssuedAt()
    .setExpirationTime(`${DURASI_SESI_DETIK}s`)
    .sign(rahasia);
}

export async function verifikasiToken(token: string | undefined | null): Promise<IsiToken | null> {
  if (!token || token.length > 2048) return null;
  const rahasia = rahasiaSesi();
  if (!rahasia) return null;
  try {
    const { payload } = await jwtVerify(token, rahasia, {
      algorithms: ["HS256"],
      issuer: PENERBIT,
      audience: AUDIENS,
    });
    const username = process.env.ADMIN_USERNAME;
    if (
      typeof payload.sid !== "string" ||
      !username ||
      payload.sub !== username ||
      payload.cv !== (await versiKredensial(rahasia))
    ) {
      return null;
    }
    return { sid: payload.sid, username };
  } catch {
    return null;
  }
}
