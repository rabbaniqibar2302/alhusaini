import "server-only";
import { dataContoh } from "@/lib/data-contoh";
import { KUNCI_REDIS } from "@/lib/kunci-redis";
import { skemaKonten, type Konten, type KunciKonten } from "@/lib/schemas";
import { tanggalWIB } from "@/lib/time";
import { getRedis, wajibRedis } from "./redis";

/**
 * Penyimpanan konten: satu kunci Redis per jenis data, nilainya JSON
 * (lihat KUNCI_REDIS). Selama sebuah kunci belum pernah diisi, data contoh
 * yang dipakai.
 */
export { KUNCI_REDIS };

const SEMUA_KUNCI = Object.keys(KUNCI_REDIS) as KunciKonten[];

/** Tag cache halaman publik; dipakai updateTag() setelah admin menyimpan. */
export const TAG_KONTEN = "konten";

let sudahDiperingatkan = false;

function nilaiKosong<K extends KunciKonten>(kunci: K, contoh: Konten): Konten[K] {
  const c = contoh[kunci];
  return (Array.isArray(c) ? [] : c) as Konten[K];
}

type HasilUrai<K extends KunciKonten> = { nilai: Konten[K]; valid: boolean };

function urai<K extends KunciKonten>(kunci: K, mentah: unknown, contoh: Konten): HasilUrai<K> {
  if (mentah === null || mentah === undefined) return { nilai: contoh[kunci], valid: true };
  const hasil = skemaKonten[kunci].safeParse(mentah);
  if (hasil.success) return { nilai: hasil.data as Konten[K], valid: true };
  // Jangan tampilkan data contoh menggantikan data asli yang rusak.
  console.error(`[store] Nilai kunci "${KUNCI_REDIS[kunci]}" tidak valid dan diabaikan.`, hasil.error.issues);
  return { nilai: nilaiKosong(kunci, contoh), valid: false };
}

function uraikan<K extends KunciKonten>(kunci: K, mentah: unknown, contoh: Konten): Konten[K] {
  return urai(kunci, mentah, contoh).nilai;
}

function peringatkanTanpaRedis() {
  if (!sudahDiperingatkan) {
    sudahDiperingatkan = true;
    console.warn("[store] Redis belum dikonfigurasi; halaman memakai data contoh.");
  }
}

/** Konten pengganti saat database tidak dapat dibaca: daftar dikosongkan, bukan diisi data contoh. */
export function kontenCadangan(hariIni: string = tanggalWIB()): Konten {
  const contoh = dataContoh(hariIni);
  const hasil: Partial<Record<KunciKonten, unknown>> = {};
  for (const k of SEMUA_KUNCI) hasil[k] = nilaiKosong(k, contoh);
  return hasil as Konten;
}

/** Membaca seluruh konten dengan satu perintah MGET. */
export async function bacaSemuaKonten(hariIni: string = tanggalWIB()): Promise<Konten> {
  const contoh = dataContoh(hariIni);
  const redis = getRedis();
  if (!redis) {
    peringatkanTanpaRedis();
    return contoh;
  }
  const nilai = await redis.mget<unknown[]>(...SEMUA_KUNCI.map((k) => KUNCI_REDIS[k]));
  const hasil: Partial<Record<KunciKonten, unknown>> = {};
  SEMUA_KUNCI.forEach((k, i) => {
    hasil[k] = uraikan(k, nilai[i], contoh);
  });
  return hasil as Konten;
}

export async function bacaKonten<K extends KunciKonten>(
  kunci: K,
  hariIni: string = tanggalWIB(),
): Promise<Konten[K]> {
  const contoh = dataContoh(hariIni);
  const redis = getRedis();
  if (!redis) {
    peringatkanTanpaRedis();
    return contoh[kunci];
  }
  return uraikan(kunci, await redis.get(KUNCI_REDIS[kunci]), contoh);
}

export async function simpanKonten<K extends KunciKonten>(kunci: K, nilai: Konten[K]): Promise<void> {
  // Validasi ulang sebelum menulis; kegagalan di sini adalah bug, bukan input user.
  const data = skemaKonten[kunci].parse(nilai);
  await wajibRedis().set(KUNCI_REDIS[kunci], data);
}

const TTL_CADANGAN = 180 * 24 * 60 * 60; // 180 hari

/**
 * Baca-ubah-tulis untuk satu kunci (admin hanya satu, jadi tanpa locking).
 * Bila nilai lama di Redis tidak lolos validasi, nilai mentahnya disalin dulu
 * ke kunci `cadangan:*` supaya tidak hilang tertimpa.
 */
export async function ubahKonten<K extends KunciKonten>(
  kunci: K,
  ubah: (lama: Konten[K]) => Konten[K],
): Promise<Konten[K]> {
  const redis = wajibRedis();
  const mentah = await redis.get(KUNCI_REDIS[kunci]);
  const lama = urai(kunci, mentah, dataContoh(tanggalWIB()));
  if (!lama.valid) {
    const kunciCadangan = `cadangan:${KUNCI_REDIS[kunci]}:${Date.now()}`;
    await redis.set(kunciCadangan, mentah, { ex: TTL_CADANGAN });
    console.error(`[store] Nilai lama disalin ke "${kunciCadangan}" sebelum ditimpa.`);
  }
  const baru = ubah(lama.nilai);
  await simpanKonten(kunci, baru);
  return baru;
}

export function redisTersedia(): boolean {
  return getRedis() !== null;
}
