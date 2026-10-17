import type { PenceramahItem } from "./schemas";

/**
 * Foto penceramah dicocokkan dengan nama di jadwal. Tanpa zod supaya ringan
 * dipakai di browser (panel admin & layar TV).
 */

/** Data foto yang dikirim ke kartu penceramah. */
export type FotoPenceramah = { url: string; lebar: number; tinggi: number; latarDihapus: boolean };

// Sapaan/gelar di depan nama yang diabaikan saat mencocokkan (sudah tanpa titik).
const GELAR_DEPAN = new Set([
  "al-ustadz",
  "buya",
  "dr",
  "drs",
  "h",
  "hj",
  "ir",
  "k",
  "kh",
  "kyai",
  "kiai",
  "prof",
  "syaikh",
  "syekh",
  "tgh",
  "ust",
  "usth",
  "ustadz",
  "ustadzah",
  "ustaz",
  "ustazah",
]);

function kataNama(nama: string): string[] {
  const kata = nama
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Gelar akademik di belakang koma: "..., Lc., M.A."
    .split(",")[0]
    .replace(/\./g, " ")
    .split(/\s+/)
    .map((k) => k.replace(/[^a-z0-9-]/g, ""))
    .filter((k) => k !== "" && k !== "-");
  let i = 0;
  while (i < kata.length - 1 && GELAR_DEPAN.has(kata[i])) i++;
  return kata.slice(i);
}

/**
 * Kunci pencocokan nama: "Ust. H. Ahmad Fauzi, Lc." dan "Ustadz Ahmad Fauzi"
 * sama-sama menjadi "ahmad fauzi".
 */
export function kunciNama(nama: string): string {
  return kataNama(nama).join(" ");
}

/** Dua huruf awal nama (tanpa gelar) untuk kartu tanpa foto. */
export function inisialNama(nama: string): string {
  const kata = kataNama(nama).filter((k) => /^[a-z]/.test(k));
  return kata
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join("");
}

export type PetaFotoPenceramah = Record<string, FotoPenceramah>;

/** Foto per kunci nama, siap dikirim ke komponen (objek biasa, bisa diserialisasi). */
export function petaFotoPenceramah(daftar: PenceramahItem[]): PetaFotoPenceramah {
  const peta: PetaFotoPenceramah = {};
  for (const p of daftar) {
    peta[kunciNama(p.nama)] = {
      url: p.foto.url,
      lebar: p.foto.lebar,
      tinggi: p.foto.tinggi,
      latarDihapus: p.latarDihapus,
    };
  }
  return peta;
}

export function fotoUntuk(peta: PetaFotoPenceramah, nama: string): FotoPenceramah | null {
  const kunci = kunciNama(nama);
  return Object.hasOwn(peta, kunci) ? peta[kunci] : null;
}
