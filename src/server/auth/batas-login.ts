import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "../redis";

/**
 * Rate limiting login dengan @upstash/ratelimit:
 * - maksimal 5 percobaan per 15 menit per IP (lalu terkunci sementara),
 * - pengaman tambahan 30 percobaan per 15 menit untuk seluruh IP, menahan
 *   tebak-password terdistribusi terhadap satu-satunya akun admin.
 * Bila Redis tidak tersedia/timeout, login ditolak (fail closed).
 */

type Pembatas = { perIp: Ratelimit; global: Ratelimit };
let pembatas: Pembatas | null | undefined;

function getPembatas(): Pembatas | null {
  if (pembatas !== undefined) return pembatas;
  const redis = getRedis();
  pembatas = redis
    ? {
        perIp: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "15 m"),
          prefix: "ratelimit:login:ip",
          ephemeralCache: false,
          analytics: false,
        }),
        global: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(30, "15 m"),
          prefix: "ratelimit:login:global",
          ephemeralCache: false,
          analytics: false,
        }),
      }
    : null;
  return pembatas;
}

export type HasilBatasLogin = { diizinkan: true } | { diizinkan: false; tungguMenit: number };

const sisaMenit = (reset: number) => Math.max(1, Math.ceil((reset - Date.now()) / 60_000));

export async function cekBatasLogin(ip: string): Promise<HasilBatasLogin> {
  const p = getPembatas();
  if (!p) return { diizinkan: false, tungguMenit: 15 };
  const perIp = await p.perIp.limit(ip);
  if (!perIp.success || perIp.reason === "timeout") {
    return { diizinkan: false, tungguMenit: sisaMenit(perIp.reset) };
  }
  const global = await p.global.limit("akun-admin");
  if (!global.success || global.reason === "timeout") {
    return { diizinkan: false, tungguMenit: sisaMenit(global.reset) };
  }
  return { diizinkan: true };
}

/** Setelah login berhasil, hitungan percobaan IP tersebut dikosongkan. */
export async function resetBatasLogin(ip: string): Promise<void> {
  await getPembatas()?.perIp.resetUsedTokens(ip);
}
