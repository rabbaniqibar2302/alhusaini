import { connection } from "next/server";

/**
 * Jam server untuk layar TV, supaya hitung mundur adzan/iqomah tetap tepat
 * walau jam di TV box tidak akurat. Hanya baca, tanpa akses database.
 */
export async function GET() {
  await connection();
  return Response.json({ sekarang: Date.now() }, { headers: { "cache-control": "no-store" } });
}
