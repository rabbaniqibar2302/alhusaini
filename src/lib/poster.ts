import { labelTanggalAgenda } from "./agenda";
import { INFO_KAJIAN, JENIS_KAJIAN, labelJamKajian, type JenisKajian } from "./kajian";
import type { FotoPenceramah } from "./penceramah";
import type { AgendaItem, Identitas, KajianItem, KhotibItem } from "./schemas";
import { alamatPendek } from "./site";
import { formatTanggal } from "./time";

/**
 * Poster story (1080×1920) untuk khotib Jumat, kajian, dan agenda, yang bisa
 * diunduh atau dibagikan pengunjung ke status WhatsApp. Modul ini menyusun isi
 * poster dari data jadwal; gambarnya dibuat di server (src/server/poster) dan
 * disajikan lewat /poster/<jenis>/<id>/<versi>.
 */

export const UKURAN_POSTER = { lebar: 1080, tinggi: 1920 } as const;

/** Naikkan setiap kali desain poster diubah, supaya tautan (dan cache) poster ikut berganti. */
const VERSI_DESAIN = 1;

export const JENIS_POSTER = ["khotib", ...JENIS_KAJIAN, "agenda"] as const;
export type JenisPoster = (typeof JENIS_POSTER)[number];

/** Potongan URL per jenis, mis. /poster/pengajian-rabu/... */
const SLUG_POSTER: Record<JenisPoster, string> = {
  khotib: "khotib-jumat",
  pengajianRabu: "pengajian-rabu",
  kuliahSubuh: "kuliah-subuh",
  pengajianIbu: "pengajian-ibu",
  agenda: "agenda",
};

/** Bagian halaman depan tempat jadwal itu tampil (untuk tautan di teks bagikan). */
const BAGIAN_POSTER: Record<JenisPoster, string> = {
  khotib: "khotib",
  pengajianRabu: "kajian",
  kuliahSubuh: "kajian",
  pengajianIbu: "kajian",
  agenda: "agenda",
};

export function jenisPosterDariSlug(slug: string): JenisPoster | null {
  return JENIS_POSTER.find((j) => SLUG_POSTER[j] === slug) ?? null;
}

export type BarisPoster = { ikon: "kalender" | "lokasi"; teks: string; sub: string };

export type PengisiPoster = {
  /** "Bersama" (kajian) atau "Khotib". */
  peran: string;
  nama: string;
  /** Baris kecil di bawah nama, mis. "Imam: ..."; kosong bila tidak ada. */
  tambahan: string;
  foto: { url: string; latarDihapus: boolean } | null;
};

export type IsiPoster = {
  jenis: JenisPoster;
  id: string;
  /** Pita di atas judul, mis. "Pengajian Rabu". */
  kategori: string;
  judul: string;
  /** Pengisi kajian / khotib; null untuk agenda. */
  pengisi: PengisiPoster | null;
  /** URL poster acara unggahan admin (agenda). */
  gambarAcara: string | null;
  /** YYYY-MM-DD; kosong untuk jadwal rutin pekanan. */
  tanggal: string;
  tanggalSelesai: string;
  /** Selalu dua baris: waktu lalu tempat. */
  baris: [BarisPoster, BarisPoster];
  ajakan: string;
  masjid: { nama: string; wilayah: string };
  logo: string | null;
  /** Origin situs, mis. "https://masjid.example.com". */
  situs: string;
  namaBerkas: string;
};

export type KonteksPoster = {
  identitas: Pick<Identitas, "nama" | "wilayah" | "alamat" | "alamatSingkat">;
  logo: string | null;
  situs: string;
};

export function konteksPoster(
  identitas: KonteksPoster["identitas"],
  logo: { url: string } | null,
  situs: string,
): KonteksPoster {
  const { nama, wilayah, alamat, alamatSingkat } = identitas;
  return { identitas: { nama, wilayah, alamat, alamatSingkat }, logo: logo?.url ?? null, situs };
}

function dariKonteks(k: KonteksPoster) {
  return { masjid: { nama: k.identitas.nama, wilayah: k.identitas.wilayah }, logo: k.logo, situs: k.situs };
}

function barisMasjid(k: KonteksPoster): BarisPoster {
  return { ikon: "lokasi", teks: k.identitas.nama, sub: alamatPendek(k.identitas) };
}

const fotoPengisi = (f: FotoPenceramah | null) => (f ? { url: f.url, latarDihapus: f.latarDihapus } : null);

/** "Tabligh Akbar Maulid Nabi!" → "tabligh-akbar-maulid-nabi" (untuk nama berkas), dipotong di batas kata. */
export function slugTeks(teks: string, maks = 40): string {
  const slug = teks
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= maks) return slug || "acara";
  const potong = slug.slice(0, maks + 1);
  const batas = potong.lastIndexOf("-");
  return batas > 0 ? potong.slice(0, batas) : slug.slice(0, maks);
}

export function posterKhotib(x: KhotibItem, foto: FotoPenceramah | null, k: KonteksPoster): IsiPoster {
  return {
    jenis: "khotib",
    id: x.id,
    kategori: "Sholat Jumat",
    judul: x.tema ? `“${x.tema}”` : "Khutbah Jumat",
    pengisi: { peran: "Khotib", nama: x.khotib, tambahan: x.imam ? `Imam: ${x.imam}` : "", foto: fotoPengisi(foto) },
    gambarAcara: null,
    tanggal: x.tanggal,
    tanggalSelesai: "",
    baris: [{ ikon: "kalender", teks: formatTanggal(x.tanggal, { hari: true }), sub: "" }, barisMasjid(k)],
    ajakan: "Mari menunaikan sholat Jumat berjamaah",
    ...dariKonteks(k),
    namaBerkas: `poster-khotib-jumat-${x.tanggal}.jpg`,
  };
}

export function posterKajian(
  jenis: JenisKajian,
  x: KajianItem,
  foto: FotoPenceramah | null,
  k: KonteksPoster,
): IsiPoster {
  const rutin = x.pola === "mingguan";
  return {
    jenis,
    id: x.id,
    kategori: INFO_KAJIAN[jenis].judul,
    judul: x.materi,
    pengisi: { peran: "Bersama", nama: x.ustadz, tambahan: "", foto: fotoPengisi(foto) },
    gambarAcara: null,
    tanggal: rutin ? "" : x.tanggal,
    tanggalSelesai: "",
    baris: [
      {
        ikon: "kalender",
        teks: rutin ? `Setiap ${x.hari}` : formatTanggal(x.tanggal, { hari: true }),
        sub: labelJamKajian(jenis, x) ?? (rutin ? "Rutin setiap pekan" : ""),
      },
      barisMasjid(k),
    ],
    ajakan:
      jenis === "pengajianIbu" ? "Mari hadir dan ajak sesama muslimah" : "Terbuka untuk umum · Ajak keluarga & sahabat",
    ...dariKonteks(k),
    namaBerkas: `poster-${SLUG_POSTER[jenis]}-${rutin ? `setiap-${slugTeks(x.hari)}` : x.tanggal}.jpg`,
  };
}

export function posterAgenda(x: AgendaItem, k: KonteksPoster): IsiPoster {
  return {
    jenis: "agenda",
    id: x.id,
    kategori: "Agenda Masjid",
    judul: x.judul,
    pengisi: null,
    gambarAcara: x.poster?.url ?? null,
    tanggal: x.tanggal,
    tanggalSelesai: x.tanggalSelesai,
    baris: [
      { ikon: "kalender", teks: labelTanggalAgenda(x, { singkat: false }), sub: x.jam ? `Pukul ${x.jam} WIB` : "" },
      x.lokasi ? { ikon: "lokasi", teks: x.lokasi, sub: "" } : barisMasjid(k),
    ],
    ajakan: "Ajak keluarga & sahabat untuk hadir",
    ...dariKonteks(k),
    namaBerkas: `poster-agenda-${slugTeks(x.judul)}-${x.tanggal}.jpg`,
  };
}

// Huruf Arab (termasuk bentuk presentasi), kecuali ligatur satu glyph ﷲ ﷺ ﷻ yang tetap tampil benar.
const HURUF_ARAB = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-ﷱﷳ-ﷹ﷼-﷿ﹰ-﻿]/g;
// Mode ketat: hanya huruf Latin, angka, tanda baca, dan simbol umum (tanpa emoji).
const DI_LUAR_FONT = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]|\p{Extended_Pictographic}/gu;

/**
 * Teks untuk digambar di poster. Pembuat gambar (Satori) tidak bisa
 * menyambung huruf Arab dan menulisnya dari kanan ke kiri, bahkan bisa gagal
 * membaca font Arab, jadi huruf Arab dibuang dari gambar (di website dan teks
 * bagikan tetap utuh). Mode ketat dipakai sebagai cadangan bila menggambar
 * tetap gagal. Hasil tanpa huruf/angka sama sekali menjadi string kosong.
 */
export function teksAmanPoster(teks: string, { ketat = false }: { ketat?: boolean } = {}): string {
  const hasil = teks
    .replace(ketat ? DI_LUAR_FONT : HURUF_ARAB, "")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/^[\s,.;:·–—-]+|[\s,;:·–—-]+$/g, "")
    .trim();
  return /[\p{L}\p{N}]/u.test(hasil) ? hasil : "";
}

/** Hash cyrb53 (bukan kriptografis): cukup untuk membedakan versi isi poster. */
function cyrb53(teks: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < teks.length; i++) {
    const c = teks.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Versi berubah setiap kali isi poster (atau desainnya) berubah, sehingga
 * gambar di satu tautan tidak pernah berubah dan boleh di-cache selamanya.
 */
export function versiPoster(isi: IsiPoster): string {
  return cyrb53(`${VERSI_DESAIN}|${JSON.stringify(isi)}`);
}

export function jalurPoster(isi: IsiPoster): string {
  return `/poster/${SLUG_POSTER[isi.jenis]}/${isi.id}/${versiPoster(isi)}`;
}

/** Teks yang ikut dibagikan bersama gambar (keterangan status/pesan WhatsApp). */
export function teksBagikanPoster(isi: IsiPoster): string {
  const [waktu, tempat] = isi.baris;
  const p = isi.pengisi;
  const baris = [`*${isi.kategori}* — ${isi.judul}`];
  if (p) baris.push(p.peran === "Bersama" ? `Bersama ${p.nama}` : `${p.peran}: ${p.nama}`);
  if (p?.tambahan) baris.push(p.tambahan);
  baris.push(
    `🗓️ ${[waktu.teks, waktu.sub].filter(Boolean).join(" · ")}`,
    `📍 ${[tempat.teks, tempat.sub].filter(Boolean).join(", ")}`,
    "",
    `Info lengkap: ${isi.situs}/#${BAGIAN_POSTER[isi.jenis]}`,
  );
  return baris.join("\n");
}

/** Data yang dikirim ke tombol poster di browser. */
export type TautanPoster = {
  href: string;
  namaBerkas: string;
  judul: string;
  /** Label tombol untuk pembaca layar (banyak tombol "Bagikan poster" dalam satu halaman). */
  label: string;
  alt: string;
  teks: string;
};

export function tautanPoster(isi: IsiPoster): TautanPoster {
  return {
    href: jalurPoster(isi),
    namaBerkas: isi.namaBerkas,
    judul: `Poster ${isi.kategori}`,
    label: `Bagikan poster ${isi.kategori}: ${isi.judul}`,
    alt: `Poster ${isi.kategori}: ${isi.judul}`,
    teks: teksBagikanPoster(isi),
  };
}
