import { SETELAN_TV_BAWAAN } from "./layar-tv";
import type { KajianItem, Konten } from "./schemas";
import { tanggalBerikutnya } from "./time";

/**
 * Data contoh supaya halaman tidak kosong saat pertama kali deploy.
 * Dipakai otomatis selama kunci di Redis belum pernah diisi, dan dapat
 * ditulis ke Redis dengan `npm run seed`. Setiap item diberi `contoh: true`
 * sehingga halaman menampilkan keterangan "data contoh" sampai admin
 * menggantinya. Nomor registrasi legalitas, sejarah, dan kegiatan masjid
 * sengaja dikosongkan karena merupakan data asli yang tidak boleh dikarang.
 */

function idContoh(kelompok: number, n: number): string {
  return `00000000-0000-4000-8000-${String(kelompok * 1000 + n).padStart(12, "0")}`;
}

export function dataContoh(hariIni: string): Konten {
  const jumat = tanggalBerikutnya(hariIni, 5, 6);
  const rabu = tanggalBerikutnya(hariIni, 3, 4);

  const khotib = [
    ["Ust. H. Ahmad Fauzi, Lc.", "Ust. Muhammad Hafidz", "Menjaga Amanah dalam Kehidupan Sehari-hari"],
    ["KH. Abdurrahman Syafi'i", "Ust. Rizki Maulana", "Keutamaan Sholat Berjamaah di Masjid"],
    ["Ust. Dr. Hasan Basri, M.A.", "Ust. Muhammad Hafidz", "Birrul Walidain: Berbakti kepada Orang Tua"],
    ["Ust. Ridwan Hakim, S.Ag.", "Ust. Rizki Maulana", "Ukhuwah Islamiyah di Tengah Masyarakat"],
    ["Ust. H. Zainal Abidin", "Ust. Muhammad Hafidz", "Sedekah sebagai Pembuka Pintu Rezeki"],
    ["Ust. Faisal Rahman, Lc., M.H.I.", "Ust. Rizki Maulana", "Menjaga Lisan di Era Media Sosial"],
  ].map(([nama, imam, tema], i) => ({
    id: idContoh(1, i + 1),
    tanggal: jumat[i],
    khotib: nama,
    imam,
    tema,
    contoh: true,
  }));

  const pengajianRabu = [
    ["Ust. Ahmad Syarifuddin", "Kajian Kitab Riyadhus Shalihin"],
    ["Ust. Muhammad Ilyas", "Tafsir Juz 'Amma"],
    ["Ust. Hamdan Fikri", "Fiqih Ibadah: Thaharah dan Sholat"],
    ["Ust. Saiful Anwar", "Sirah Nabawiyah"],
  ].map(
    ([ustadz, materi], i): KajianItem => ({
      id: idContoh(2, i + 1),
      pola: "tanggal",
      tanggal: rabu[i],
      hari: "",
      jam: "19:30",
      ustadz,
      materi,
      contoh: true,
    }),
  );

  // Hari: 0 = Ahad ... 6 = Sabtu.
  const kuliahSubuh = (
    [
      [0, "Ust. Ahmad Syarifuddin", "Tafsir Al-Qur'an Tematik"],
      [2, "Ust. Hamdan Fikri", "Hadits Arba'in An-Nawawi"],
      [4, "Ust. Muhammad Ilyas", "Fiqih Muamalah Sehari-hari"],
      [6, "Ust. Saiful Anwar", "Akhlak dan Adab Seorang Muslim"],
    ] as const
  ).map(
    ([hari, ustadz, materi], i): KajianItem => ({
      id: idContoh(3, i + 1),
      pola: "tanggal",
      tanggal: tanggalBerikutnya(hariIni, hari, 1)[0],
      hari: "",
      jam: "",
      ustadz,
      materi,
      contoh: true,
    }),
  );

  const pengajianIbu = (
    [
      [2, "09:00", "Ustadzah Hj. Siti Aminah", "Tahsin dan Tajwid Al-Qur'an"],
      [4, "13:30", "Ust. H. Abdul Karim, Lc.", "Fiqih Wanita: Thaharah dan Ibadah"],
      [6, "15:30", "Ustadzah Rahmawati", "Parenting Islami: Mendidik Anak Shalih"],
    ] as const
  ).map(
    ([hari, jam, ustadz, materi], i): KajianItem => ({
      id: idContoh(4, i + 1),
      pola: "tanggal",
      tanggal: tanggalBerikutnya(hariIni, hari, 1)[0],
      hari: "",
      jam,
      ustadz,
      materi,
      contoh: true,
    }),
  );

  const galeri = [
    ["/images/contoh-ambulans-1.svg", "Layanan ambulans untuk warga sekitar masjid"],
    ["/images/contoh-ambulans-2.svg", "Pengantaran jenazah ke tempat pemakaman"],
    ["/images/contoh-ambulans-3.svg", "Siaga ambulans saat kegiatan besar masjid"],
  ].map(([url, keterangan], i) => ({
    id: idContoh(5, i + 1),
    foto: { url, pathname: null, lebar: 1200, tinggi: 900 },
    keterangan,
    tanggal: "",
    contoh: true,
  }));

  return {
    khotib,
    pengajianRabu,
    kuliahSubuh,
    pengajianIbu,
    countdown: { koreksiHijriah: 0, penetapan: [] },
    kontak: { telepon: "", whatsapp: "", email: "", instagram: "" },
    legalitas: {
      kemenag: { nomor: "", foto: null },
      dmi: { nomor: "", foto: null },
    },
    hero: null,
    galeri,
    pengumuman: [
      "Mohon nonaktifkan atau senyapkan HP selama berada di dalam masjid.",
      "Jagalah kebersihan masjid dan simpan alas kaki di tempat yang telah disediakan.",
    ].map((teks, i) => ({
      id: idContoh(6, i + 1),
      teks,
      mulai: "",
      sampai: "",
      diWebsite: false,
      contoh: true,
    })),
    kegiatan: [],
    sejarah: { narasi: "", foto: [] },
    logo: null,
    tv: SETELAN_TV_BAWAAN,
    adzan: { umum: null, subuh: null },
  };
}
