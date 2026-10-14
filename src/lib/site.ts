/** Identitas tetap masjid. Data yang bisa diubah admin disimpan di Redis. */
export const SITE = {
  nama: "Masjid Al Husaini",
  namaArab: "مسجد الحسيني",
  alamat:
    "Jl. Mardani Raya, Gang S No. 2, RT.2/RW.5, Johar Baru, Kec. Johar Baru, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10560",
  alamatSingkat: "Jl. Mardani Raya, Gang S No. 2, Johar Baru, Jakarta Pusat",
  kotaJadwalSholat: "Jakarta Pusat",
  /** Perkiraan lokasi masjid; dipakai untuk perhitungan cadangan jadwal sholat. */
  koordinat: { lat: -6.1849, lng: 106.8566 },
  deskripsi:
    "Website resmi Masjid Al Husaini, Johar Baru, Jakarta Pusat: jadwal sholat, jadwal khotib Jumat, kajian, dan kegiatan ambulans masjid.",
} as const;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.nama}, ${SITE.alamatSingkat}`,
)}`;
