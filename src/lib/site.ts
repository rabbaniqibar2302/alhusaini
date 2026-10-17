import type { Identitas } from "./schemas";

/**
 * Identitas bawaan masjid. Admin dapat menggantinya di menu Identitas Masjid
 * (disimpan di Redis); nilai ini dipakai selama belum pernah diubah, atau
 * saat database tidak dapat dibaca.
 */
export const IDENTITAS_BAWAAN: Identitas = {
  nama: "Masjid Al Husaini",
  namaArab: "مسجد الحسيني",
  wilayah: "Johar Baru, Jakarta Pusat",
  alamat:
    "Jl. Mardani Raya, Gang S No. 2, RT.2/RW.5, Johar Baru, Kec. Johar Baru, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10560",
  alamatSingkat: "Jl. Mardani Raya, Gang S No. 2, Johar Baru, Jakarta Pusat",
};

/**
 * Lokasi jadwal sholat. Tetap diatur di kode (tidak ikut berubah saat admin
 * mengganti alamat); pencarian kota di API myQuran ada di
 * src/server/jadwal-sholat.ts, dan seluruh waktu memakai WIB.
 */
export const LOKASI_SHOLAT = {
  kota: "Jakarta Pusat",
  /** Perkiraan lokasi masjid; dipakai untuk perhitungan cadangan jadwal sholat. */
  koordinat: { lat: -6.1849, lng: 106.8566 },
} as const;

/** Alamat untuk tempat yang sempit (layar TV) dan pencarian Google Maps. */
export function alamatPendek(x: Pick<Identitas, "alamat" | "alamatSingkat">): string {
  return x.alamatSingkat || x.alamat;
}

/** "Masjid Al Husaini, Johar Baru, Jakarta Pusat", atau nama saja bila wilayah kosong. */
export function namaDenganWilayah(x: Pick<Identitas, "nama" | "wilayah">, pemisah = ", "): string {
  return x.wilayah ? `${x.nama}${pemisah}${x.wilayah}` : x.nama;
}

export function deskripsiSitus(x: Pick<Identitas, "nama" | "wilayah">): string {
  return `Website resmi ${namaDenganWilayah(x)}: jadwal sholat, jadwal khotib Jumat, kajian, dan kegiatan ambulans masjid.`;
}

export function urlMaps(x: Pick<Identitas, "nama" | "alamat" | "alamatSingkat">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.nama}, ${alamatPendek(x)}`)}`;
}
