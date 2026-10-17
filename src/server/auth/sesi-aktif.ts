import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getRedis } from "../redis";
import { verifikasiToken } from "./token";

export type SesiAdmin = { sid: string; username: string };

export const kunciSesi = (sid: string) => `sesi:${sid}`;

/**
 * Verifikasi penuh sebuah token sesi: tanda tangan + masa berlaku JWT, lalu
 * memastikan sesi masih aktif di Redis (belum logout/dicabut). Gagal tertutup:
 * bila Redis tidak tersedia, sesi dianggap tidak valid. Dipakai proxy dan server.
 */
export async function verifikasiSesiDariToken(token: string | undefined): Promise<SesiAdmin | null> {
  const isi = await verifikasiToken(token);
  if (!isi) return null;
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.exists(kunciSesi(isi.sid))) ? { sid: isi.sid, username: isi.username } : null;
  } catch (err) {
    // Galat internal Next.js (mis. prerender dihentikan) diteruskan, bukan dicatat sebagai gangguan Redis.
    unstable_rethrow(err);
    console.error("[auth] Gagal memeriksa sesi di Redis:", (err as Error).message);
    return null;
  }
}
