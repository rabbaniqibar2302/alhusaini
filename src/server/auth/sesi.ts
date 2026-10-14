import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getRedis, wajibRedis } from "../redis";
import { kunciSesi, verifikasiSesiDariToken, type SesiAdmin } from "./sesi-aktif";
import { DURASI_SESI_DETIK, NAMA_COOKIE_SESI, buatToken, opsiCookieSesi, verifikasiToken } from "./token";

/**
 * Sesi admin = cookie bertanda tangan (JWT) + entri sesi aktif di Redis.
 * Entri Redis memungkinkan logout benar-benar mencabut sesi di server,
 * bukan sekadar menghapus cookie di browser.
 */

export type { SesiAdmin };

export async function buatSesi(username: string, info: { ip: string; userAgent: string }): Promise<void> {
  const redis = wajibRedis();
  const sid = randomBytes(32).toString("base64url");
  await redis.set(
    kunciSesi(sid),
    { username, dibuat: new Date().toISOString(), ip: info.ip, userAgent: info.userAgent.slice(0, 200) },
    { ex: DURASI_SESI_DETIK },
  );
  const token = await buatToken(sid, username);
  (await cookies()).set(NAMA_COOKIE_SESI, token, opsiCookieSesi());
}

/** Verifikasi penuh: tanda tangan + masa berlaku token + sesi masih aktif di Redis. */
export async function bacaSesi(): Promise<SesiAdmin | null> {
  const token = (await cookies()).get(NAMA_COOKIE_SESI)?.value;
  return verifikasiSesiDariToken(token);
}

/** Mencabut sesi di Redis berdasarkan token (dipakai logout & login ulang). */
export async function cabutSesiDariToken(token: string | undefined): Promise<void> {
  const isi = await verifikasiToken(token);
  if (isi) await getRedis()?.del(kunciSesi(isi.sid));
}
