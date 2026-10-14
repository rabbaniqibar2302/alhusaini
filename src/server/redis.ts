import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Klien Upstash Redis (REST). Integrasi Upstash di Vercel Marketplace
 * menyediakan KV_REST_API_URL / KV_REST_API_TOKEN; nama standar Upstash
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) juga didukung.
 * Token hanya dibaca di server dan tidak pernah dikirim ke browser.
 */

let klien: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (klien !== undefined) return klien;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  klien = url && token ? new Redis({ url, token }) : null;
  return klien;
}

export class RedisBelumDikonfigurasi extends Error {
  constructor() {
    super(
      "Database Redis belum dikonfigurasi. Hubungkan Upstash Redis (Vercel Marketplace) atau isi UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN.",
    );
    this.name = "RedisBelumDikonfigurasi";
  }
}

export function wajibRedis(): Redis {
  const r = getRedis();
  if (!r) throw new RedisBelumDikonfigurasi();
  return r;
}
