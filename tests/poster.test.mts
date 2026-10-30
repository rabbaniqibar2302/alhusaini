import assert from "node:assert/strict";
import { test } from "node:test";
import { labelTanggalAgenda } from "../src/lib/agenda";
import {
  JENIS_POSTER,
  jalurPoster,
  jenisPosterDariSlug,
  konteksPoster,
  posterAgenda,
  posterKajian,
  posterKhotib,
  slugTeks,
  tautanPoster,
  teksAmanPoster,
  teksBagikanPoster,
  versiPoster,
  type IsiPoster,
} from "../src/lib/poster";
import type { AgendaItem, KajianItem, KhotibItem } from "../src/lib/schemas";
import { IDENTITAS_BAWAAN } from "../src/lib/site";

const FOTO = {
  url: "https://abc123.public.blob.vercel-storage.com/masjid/penceramah/0b9f4c4e-8c3e-4f7e-9d3a-2a1b3c4d5e6f.webp",
  lebar: 800,
  tinggi: 1000,
  latarDihapus: true,
};

const konteks = konteksPoster(IDENTITAS_BAWAAN, null, "https://masjid.example.com");

const kajian = (x: Partial<KajianItem> = {}): KajianItem => ({
  id: "6a1f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
  pola: "tanggal",
  tanggal: "2026-11-04",
  hari: "",
  jam: "19:30",
  ustadz: "Ustadz Ahmad Fauzi, Lc.",
  materi: "Adab Menuntut Ilmu",
  ...x,
});

const khotib = (x: Partial<KhotibItem> = {}): KhotibItem => ({
  id: "7b2f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
  tanggal: "2026-11-06",
  khotib: "Ustadz Hasan Basri",
  imam: "Ustadz Fulan",
  tema: "Menjaga Lisan",
  ...x,
});

const agenda = (x: Partial<AgendaItem> = {}): AgendaItem => ({
  id: "8c3f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
  judul: "Santunan Anak Yatim",
  tanggal: "2026-11-21",
  tanggalSelesai: "",
  jam: "",
  lokasi: "",
  keterangan: "",
  poster: null,
  ...x,
});

test("poster kajian: jadwal bertanggal & rutin pekanan", () => {
  const bertanggal = posterKajian("pengajianRabu", kajian(), FOTO, konteks);
  assert.equal(bertanggal.kategori, "Pengajian Rabu");
  assert.equal(bertanggal.judul, "Adab Menuntut Ilmu");
  assert.deepEqual(bertanggal.pengisi, {
    peran: "Bersama",
    nama: "Ustadz Ahmad Fauzi, Lc.",
    tambahan: "",
    foto: { url: FOTO.url, latarDihapus: true },
  });
  assert.deepEqual(bertanggal.baris[0], { ikon: "kalender", teks: "Rabu, 4 November 2026", sub: "Pukul 19:30 WIB" });
  assert.deepEqual(bertanggal.baris[1], {
    ikon: "lokasi",
    teks: IDENTITAS_BAWAAN.nama,
    sub: IDENTITAS_BAWAAN.alamatSingkat,
  });
  assert.equal(bertanggal.namaBerkas, "poster-pengajian-rabu-2026-11-04.jpg");

  const rutin = posterKajian("kuliahSubuh", kajian({ pola: "mingguan", tanggal: "", hari: "Ahad", jam: "" }), null, konteks);
  assert.equal(rutin.tanggal, "");
  assert.equal(rutin.pengisi?.foto, null);
  assert.deepEqual(rutin.baris[0], { ikon: "kalender", teks: "Setiap Ahad", sub: "Ba'da Subuh" });
  assert.equal(rutin.namaBerkas, "poster-kuliah-subuh-setiap-ahad.jpg");

  const tanpaJam = posterKajian("pengajianIbu", kajian({ pola: "mingguan", tanggal: "", hari: "Kamis", jam: "" }), null, konteks);
  assert.equal(tanpaJam.baris[0].sub, "Rutin setiap pekan");
  assert.match(tanpaJam.ajakan, /muslimah/);
});

test("poster khotib: tema, imam, dan judul pengganti", () => {
  const lengkap = posterKhotib(khotib(), FOTO, konteks);
  assert.equal(lengkap.kategori, "Sholat Jumat");
  assert.equal(lengkap.judul, "“Menjaga Lisan”");
  assert.equal(lengkap.pengisi?.peran, "Khotib");
  assert.equal(lengkap.pengisi?.tambahan, "Imam: Ustadz Fulan");
  assert.equal(lengkap.baris[0].teks, "Jumat, 6 November 2026");

  const polos = posterKhotib(khotib({ tema: "", imam: "" }), null, konteks);
  assert.equal(polos.judul, "Khutbah Jumat");
  assert.equal(polos.pengisi?.tambahan, "");
});

test("poster agenda: rentang tanggal, jam, lokasi, dan poster acara", () => {
  const dasar = posterAgenda(agenda({ tanggalSelesai: "2026-11-22" }), konteks);
  assert.equal(dasar.pengisi, null);
  assert.equal(dasar.gambarAcara, null);
  assert.deepEqual(dasar.baris[0], { ikon: "kalender", teks: "21–22 November 2026", sub: "" });
  assert.equal(dasar.baris[1].teks, IDENTITAS_BAWAAN.nama);

  const lengkap = posterAgenda(
    agenda({
      jam: "08:00",
      lokasi: "Halaman masjid",
      poster: {
        url: "https://abc123.public.blob.vercel-storage.com/masjid/agenda/0b9f4c4e-8c3e-4f7e-9d3a-2a1b3c4d5e6f.webp",
        pathname: "masjid/agenda/0b9f4c4e-8c3e-4f7e-9d3a-2a1b3c4d5e6f.webp",
        lebar: 1080,
        tinggi: 1350,
      },
    }),
    konteks,
  );
  assert.deepEqual(lengkap.baris[0], { ikon: "kalender", teks: "Sabtu, 21 November 2026", sub: "Pukul 08:00 WIB" });
  assert.deepEqual(lengkap.baris[1], { ikon: "lokasi", teks: "Halaman masjid", sub: "" });
  assert.match(lengkap.gambarAcara ?? "", /\/masjid\/agenda\//);
  assert.equal(lengkap.namaBerkas, "poster-agenda-santunan-anak-yatim-2026-11-21.jpg");

  assert.equal(labelTanggalAgenda({ tanggal: "2026-10-30", tanggalSelesai: "2026-11-01" }, { singkat: false }), "30 Oktober – 1 November 2026");
  assert.equal(labelTanggalAgenda({ tanggal: "2026-10-30", tanggalSelesai: "2026-11-01" }), "30 Okt – 1 Nov 2026");
});

test("versi & jalur poster: tetap untuk isi yang sama, berubah bila isi berubah", () => {
  const a = posterKajian("pengajianRabu", kajian(), FOTO, konteks);
  const b = posterKajian("pengajianRabu", kajian(), FOTO, konteks);
  assert.equal(versiPoster(a), versiPoster(b));
  assert.notEqual(versiPoster(a), versiPoster(posterKajian("pengajianRabu", kajian({ materi: "Adab Menuntut Ilmu 2" }), FOTO, konteks)));
  assert.notEqual(versiPoster(a), versiPoster(posterKajian("pengajianRabu", kajian(), { ...FOTO, latarDihapus: false }, konteks)));
  assert.notEqual(versiPoster(a), versiPoster(posterKajian("pengajianRabu", kajian(), FOTO, { ...konteks, logo: FOTO.url })));

  const jalur = jalurPoster(a);
  assert.match(jalur, /^\/poster\/pengajian-rabu\/6a1f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e\/[0-9a-z]+$/);
  assert.equal(jenisPosterDariSlug(jalur.split("/")[2]), "pengajianRabu");
});

test("slug poster: setiap jenis bisa dibaca balik dari URL", () => {
  const isi: Record<(typeof JENIS_POSTER)[number], IsiPoster> = {
    khotib: posterKhotib(khotib(), null, konteks),
    pengajianRabu: posterKajian("pengajianRabu", kajian(), null, konteks),
    kuliahSubuh: posterKajian("kuliahSubuh", kajian(), null, konteks),
    pengajianIbu: posterKajian("pengajianIbu", kajian(), null, konteks),
    agenda: posterAgenda(agenda(), konteks),
  };
  for (const jenis of JENIS_POSTER) {
    assert.equal(jenisPosterDariSlug(jalurPoster(isi[jenis]).split("/")[2]), jenis);
  }
  for (const salah of ["", "khotib", "pengajianRabu", "../agenda", "AGENDA"]) {
    assert.equal(jenisPosterDariSlug(salah), null, salah);
  }
});

test("nama berkas: aman, tanpa diakritik, dipotong di batas kata", () => {
  assert.equal(slugTeks("Tabligh Akbar Peringatan Isra Mi'raj 1448 H"), "tabligh-akbar-peringatan-isra-mi-raj");
  assert.equal(slugTeks("Café Ramadhan — Ifṭār Bersama!"), "cafe-ramadhan-iftar-bersama");
  assert.equal(slugTeks("مسجد"), "acara");
  assert.equal(slugTeks("Supercalifragilisticexpialidocious-panjang-sekali", 10), "supercalif");
});

test("teks gambar poster: huruf Arab dibuang, ligatur ﷺ tetap, mode ketat untuk cadangan", () => {
  assert.equal(teksAmanPoster("Tadabbur Surat الفاتحة"), "Tadabbur Surat");
  assert.equal(teksAmanPoster("Fiqih: الطهارة"), "Fiqih");
  assert.equal(teksAmanPoster("Kitab الأربعين (Arbain Nawawi)"), "Kitab (Arbain Nawawi)");
  assert.equal(teksAmanPoster("Kajian (الفاتحة) pekanan"), "Kajian pekanan");
  assert.equal(teksAmanPoster("Peringatan Maulid Nabi ﷺ"), "Peringatan Maulid Nabi ﷺ");
  assert.equal(teksAmanPoster("Adab Menuntut Ilmu!"), "Adab Menuntut Ilmu!");
  assert.equal(teksAmanPoster("“الفاتحة”"), "");
  assert.equal(teksAmanPoster("الفاتحة"), "");
  assert.equal(teksAmanPoster("Maulid Nabi ﷺ 🌙", { ketat: true }), "Maulid Nabi");
  assert.equal(teksAmanPoster("Ustadz Fulan, Lc. — “Café”", { ketat: true }), "Ustadz Fulan, Lc. — “Café”");
});

test("teks bagikan & data tombol poster", () => {
  const isi = posterKhotib(khotib(), FOTO, konteks);
  assert.equal(
    teksBagikanPoster(isi),
    [
      "*Sholat Jumat* — “Menjaga Lisan”",
      "Khotib: Ustadz Hasan Basri",
      "Imam: Ustadz Fulan",
      "🗓️ Jumat, 6 November 2026",
      `📍 ${IDENTITAS_BAWAAN.nama}, ${IDENTITAS_BAWAAN.alamatSingkat}`,
      "",
      "Info lengkap: https://masjid.example.com/#khotib",
    ].join("\n"),
  );
  const kajianTeks = teksBagikanPoster(posterKajian("pengajianRabu", kajian(), null, konteks));
  assert.match(kajianTeks, /^\*Pengajian Rabu\* — Adab Menuntut Ilmu\nBersama Ustadz Ahmad Fauzi, Lc\.\n🗓️ Rabu, 4 November 2026 · Pukul 19:30 WIB\n/);
  assert.match(kajianTeks, /#kajian$/);

  const tombol = tautanPoster(isi);
  assert.equal(tombol.href, jalurPoster(isi));
  assert.equal(tombol.namaBerkas, "poster-khotib-jumat-2026-11-06.jpg");
  assert.equal(tombol.judul, "Poster Sholat Jumat");
  assert.equal(tombol.label, "Bagikan poster Sholat Jumat: “Menjaga Lisan”");
  assert.equal(tombol.alt, "Poster Sholat Jumat: “Menjaga Lisan”");

  // Hanya data yang tampil di poster yang ikut (nama Arab tidak dipakai).
  assert.deepEqual(Object.keys(konteks.identitas).sort(), ["alamat", "alamatSingkat", "nama", "wilayah"]);
});
