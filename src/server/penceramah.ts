import "server-only";
import { randomUUID } from "node:crypto";
import { MAKS_PENCERAMAH } from "@/lib/batas";
import { kunciNama } from "@/lib/penceramah";
import type { Foto } from "@/lib/schemas";
import { ubahKonten } from "./store";
import { FotoTidakValid, hapusFoto, prosesDanUnggahFoto } from "./unggah-foto";

/**
 * Foto penceramah (khotib, ustadz/ustadzah). Latar belakang dihapus di
 * browser admin sebelum diunggah; server tetap memvalidasi & meng-encode
 * ulang seperti foto lain (transparansi dipertahankan).
 */
export function unggahFotoPenceramah(file: FormDataEntryValue | null): Promise<Foto> {
  return prosesDanUnggahFoto(file, "penceramah", { sisiMaks: 1200, kualitasTinggi: true });
}

/**
 * Menyimpan foto untuk nama tersebut (menggantikan foto lama dengan kunci
 * nama yang sama). Bila gagal, foto yang baru diunggah ikut dihapus.
 */
export async function pasangFotoPenceramah(nama: string, foto: Foto, latarDihapus: boolean): Promise<void> {
  const kunci = kunciNama(nama);
  let fotoLama: Foto | null = null;
  try {
    await ubahKonten("penceramah", (daftar) => {
      const i = daftar.findIndex((p) => kunciNama(p.nama) === kunci);
      if (i >= 0) {
        fotoLama = daftar[i].foto;
        return daftar.map((p, j) => (j === i ? { ...p, nama, foto, latarDihapus } : p));
      }
      if (daftar.length >= MAKS_PENCERAMAH) {
        throw new FotoTidakValid(`Maksimal ${MAKS_PENCERAMAH} foto penceramah. Hapus foto yang tidak dipakai lagi.`);
      }
      return [...daftar, { id: randomUUID(), nama, foto, latarDihapus }];
    });
  } catch (err) {
    await hapusFoto(foto);
    throw err;
  }
  await hapusFoto(fotoLama);
}
