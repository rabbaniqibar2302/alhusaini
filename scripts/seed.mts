/**
 * Mengisi Redis dengan data contoh supaya halaman tidak kosong.
 *
 *   npm run seed            → hanya mengisi kunci yang masih kosong
 *   npm run seed -- --paksa → menimpa semua kunci dengan data contoh
 *
 * Membaca kredensial Redis dari .env.local / .env (pakai `vercel env pull`).
 * Tanpa seed pun, halaman tetap menampilkan data contoh selama kunci kosong.
 */
import { Redis } from "@upstash/redis";
import { dataContoh } from "../src/lib/data-contoh";
import { KUNCI_REDIS } from "../src/lib/kunci-redis";
import { skemaKonten, type KunciKonten } from "../src/lib/schemas";
import { tanggalWIB } from "../src/lib/time";

for (const berkas of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(berkas);
  } catch {
    // berkas tidak ada: lewati
  }
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("✗ Kredensial Redis tidak ditemukan. Jalankan `vercel env pull .env.local` atau isi UPSTASH_REDIS_REST_URL/TOKEN.");
  process.exit(1);
}

const paksa = process.argv.includes("--paksa");
const redis = new Redis({ url, token });
const contoh = dataContoh(tanggalWIB());

for (const kunci of Object.keys(KUNCI_REDIS) as KunciKonten[]) {
  const nilai = skemaKonten[kunci].parse(contoh[kunci]);
  const hasil = paksa
    ? await redis.set(KUNCI_REDIS[kunci], nilai)
    : await redis.set(KUNCI_REDIS[kunci], nilai, { nx: true });
  console.log(`${hasil === "OK" ? "✓ diisi " : "• dilewati (sudah ada)"}  ${KUNCI_REDIS[kunci]}`);
}
console.log(paksa ? "\nSelesai (mode --paksa)." : "\nSelesai. Gunakan --paksa untuk menimpa data yang sudah ada.");
