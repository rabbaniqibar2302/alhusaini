import "server-only";
import { z } from "zod";
import { hitungJadwalLokal, jadwalPerhitungan, type WaktuSholat } from "@/lib/hitung-sholat";
import { SITE } from "@/lib/site";
import { JAM_REGEX } from "@/lib/time";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";
import { getRedis } from "./redis";

/**
 * Jadwal sholat harian dari API myQuran (data Kemenag RI / Bimas Islam).
 *
 * Alur: cache Redis per tanggal → API myQuran v3 → API myQuran v2 →
 * perhitungan lokal (metode Kemenag: Subuh 20°, Isya 18°) bila API tidak
 * dapat dihubungi. Hasil dari API disimpan per hari supaya API hanya
 * dipanggil sekali sehari per tanggal (menghindari batas 100 request/menit).
 */

export type { JadwalHarian };
export { hitungJadwalLokal };

const API_V3 = "https://api.myquran.com/v3";
const API_V2 = "https://api.myquran.com/v2";
const KATA_KUNCI_KOTA = ["jakarta pusat", "jakarta"];
const TTL_JADWAL_API = 3 * 24 * 60 * 60; // 3 hari
const TTL_JADWAL_CADANGAN = 15 * 60; // coba API lagi setelah 15 menit
const TTL_KOTA = 30 * 24 * 60 * 60;
const VERSI_CACHE = "v1";

const jam = z
  .string()
  .transform((s) => s.trim().replace(/^(\d):/, "0$1:").slice(0, 5))
  .pipe(z.string().regex(JAM_REGEX));

const waktuSchema = z.object({
  imsak: jam,
  subuh: jam,
  terbit: jam,
  dzuhur: jam,
  ashar: jam,
  maghrib: jam,
  isya: jam,
});

const jadwalTersimpanSchema = waktuSchema.extend({
  tanggal: z.iso.date(),
  sumber: z.enum(["kemenag", "perhitungan"]),
  lokasi: z.string().max(100),
});

const kotaSchema = z.object({ id: z.union([z.string(), z.number()]).transform(String), lokasi: z.string() });

async function ambilJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "MasjidAlHusaini/1.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} dari ${url}`);
  return res.json();
}

function objek(x: unknown): Record<string, unknown> | null {
  return x !== null && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}

/** Memilih entri kota paling cocok untuk Jakarta Pusat dari hasil pencarian. */
export function pilihKota(json: unknown): { id: string; lokasi: string } | null {
  const data = objek(json)?.data;
  if (!Array.isArray(data)) return null;
  let terbaik: { id: string; lokasi: string } | null = null;
  let skorTerbaik = 0;
  for (const item of data) {
    const k = kotaSchema.safeParse(item);
    if (!k.success) continue;
    const nama = k.data.lokasi.toUpperCase().replace(/\s+/g, " ").trim();
    let skor = 0;
    if (nama.includes("JAKARTA PUSAT")) skor = 3;
    else if (nama === "KOTA JAKARTA" || nama === "JAKARTA") skor = 2;
    else if (nama.includes("JAKARTA") && !nama.includes("SERIBU")) skor = 1;
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      terbaik = { id: k.data.id, lokasi: k.data.lokasi };
    }
  }
  return terbaik;
}

/**
 * Mengambil waktu sholat untuk `tanggal` dari respons API. Dibuat toleran
 * terhadap beberapa bentuk respons: v2 (`data.jadwal` berisi satu hari atau
 * array), dan v3 (`data.jadwal` berupa objek per tanggal atau satu hari).
 */
export function uraikanJadwal(json: unknown, tanggal: string): { waktu: WaktuSholat; lokasi: string } | null {
  const akar = objek(json);
  if (!akar || akar.status === false) return null;
  const data = objek(akar.data);
  if (!data) return null;
  const lokasi = String(data.lokasi ?? data.kabko ?? data.kota ?? "");
  const jadwal = data.jadwal ?? data;
  const [y, m, d] = tanggal.split("-");
  const cocokTanggal = (item: Record<string, unknown>) => {
    const tgl = item.date ?? item.tanggal_iso;
    if (typeof tgl === "string") return tgl.slice(0, 10) === tanggal;
    if (typeof item.tanggal === "string") {
      return item.tanggal.startsWith(tanggal) || item.tanggal.includes(`${d}/${m}/${y}`);
    }
    return true; // tidak ada keterangan tanggal: anggap sesuai permintaan
  };

  let kandidat: Record<string, unknown> | null = null;
  if (Array.isArray(jadwal)) {
    kandidat = jadwal.map(objek).find((it): it is Record<string, unknown> => !!it && cocokTanggal(it)) ?? null;
  } else {
    const o = objek(jadwal);
    if (o) {
      const perTanggal = objek(o[tanggal]);
      if (perTanggal) kandidat = perTanggal;
      else if ("subuh" in o && cocokTanggal(o)) kandidat = o;
    }
  }
  if (!kandidat) return null;
  const waktu = waktuSchema.safeParse(kandidat);
  return waktu.success ? { waktu: waktu.data, lokasi } : null;
}

async function cariKota(versi: "v3" | "v2"): Promise<{ id: string; lokasi: string } | null> {
  if (versi === "v3" && process.env.MYQURAN_KOTA_ID) {
    return { id: process.env.MYQURAN_KOTA_ID, lokasi: SITE.kotaJadwalSholat };
  }
  const redis = getRedis();
  const kunciCache = `cache:jadwal-sholat:kota:${versi}`;
  try {
    const tersimpan = kotaSchema.safeParse(await redis?.get(kunciCache));
    if (tersimpan.success) return tersimpan.data;
  } catch {
    // cache opsional
  }
  for (const kataKunci of KATA_KUNCI_KOTA) {
    const url =
      versi === "v3"
        ? `${API_V3}/sholat/kabkota/cari/${encodeURIComponent(kataKunci)}`
        : `${API_V2}/sholat/kota/cari/${encodeURIComponent(kataKunci)}`;
    try {
      const kota = pilihKota(await ambilJson(url));
      if (kota) {
        await redis?.set(kunciCache, kota, { ex: TTL_KOTA }).catch(() => {});
        return kota;
      }
    } catch (err) {
      console.warn(`[jadwal-sholat] Pencarian kota (${versi}) gagal:`, (err as Error).message);
    }
  }
  return null;
}

async function ambilDariApi(versi: "v3" | "v2", tanggal: string) {
  const kota = await cariKota(versi);
  if (!kota) return null;
  const [y, m, d] = tanggal.split("-");
  const url =
    versi === "v3"
      ? `${API_V3}/sholat/jadwal/${encodeURIComponent(kota.id)}/${tanggal}?tz=Asia/Jakarta`
      : `${API_V2}/sholat/jadwal/${encodeURIComponent(kota.id)}/${y}/${m}/${d}`;
  const hasil = uraikanJadwal(await ambilJson(url), tanggal);
  if (!hasil) throw new Error(`Format respons API ${versi} tidak dikenali`);
  return { ...hasil, lokasi: hasil.lokasi || kota.lokasi };
}

export async function getJadwalSholat(tanggal: string): Promise<JadwalHarian> {
  const redis = getRedis();
  const kunci = `cache:jadwal-sholat:${VERSI_CACHE}:${tanggal}`;

  try {
    const tersimpan = jadwalTersimpanSchema.safeParse(await redis?.get(kunci));
    if (tersimpan.success) return tersimpan.data;
  } catch (err) {
    console.warn("[jadwal-sholat] Gagal membaca cache:", (err as Error).message);
  }

  for (const versi of ["v3", "v2"] as const) {
    try {
      const hasil = await ambilDariApi(versi, tanggal);
      if (!hasil) continue;
      const jadwal: JadwalHarian = { tanggal, ...hasil.waktu, sumber: "kemenag", lokasi: hasil.lokasi };
      await redis?.set(kunci, jadwal, { ex: TTL_JADWAL_API }).catch(() => {});
      return jadwal;
    } catch (err) {
      console.warn(`[jadwal-sholat] API myQuran ${versi} gagal:`, (err as Error).message);
    }
  }

  const cadangan = jadwalPerhitungan(tanggal);
  await redis?.set(kunci, cadangan, { ex: TTL_JADWAL_CADANGAN }).catch(() => {});
  return cadangan;
}
