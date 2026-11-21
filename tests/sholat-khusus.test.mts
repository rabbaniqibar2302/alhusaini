import assert from "node:assert/strict";
import { test } from "node:test";
import { jalurPoster, jenisPosterDariSlug, konteksPoster, posterSholatKhusus, teksBagikanPoster } from "../src/lib/poster";
import { dataContoh } from "../src/lib/data-contoh";
import { inputJadwal, skemaKonten, type SholatKhususItem } from "../src/lib/schemas";
import { judulBagianSholatKhusus, labelSholatKhusus, sholatKhususMendatang } from "../src/lib/sholat-khusus";
import { IDENTITAS_BAWAAN } from "../src/lib/site";

const item = (x: Partial<SholatKhususItem> = {}): SholatKhususItem => ({
  id: "9d4f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
  jenis: "idulFitri",
  tanggal: "2027-03-09",
  jam: "06:30",
  khotib: "Ustadz Ahmad Fauzi, Lc.",
  imam: "Ustadz Fulan",
  tema: "",
  lokasi: "",
  catatan: "",
  ...x,
});

test("validasi jadwal sholat Ied & gerhana", () => {
  const sah = {
    jenis: "gerhanaBulan",
    tanggal: "2026-12-01",
    jam: "19:30",
    khotib: "Ust. Hasan",
    imam: "",
    tema: "",
    lokasi: "",
    catatan: "Gerhana puncak 19.40 WIB",
  };
  assert.equal(inputJadwal.sholatKhusus.safeParse(sah).success, true);
  assert.equal(inputJadwal.sholatKhusus.safeParse({ ...sah, jenis: "istisqa" }).success, false);
  assert.equal(inputJadwal.sholatKhusus.safeParse({ ...sah, jam: "" }).success, false);
  assert.equal(inputJadwal.sholatKhusus.safeParse({ ...sah, khotib: "" }).success, false);
  assert.equal(inputJadwal.sholatKhusus.safeParse({ ...sah, catatan: "x".repeat(201) }).success, false);
  // Tidak ada data contoh: jadwal hari raya harus diisi pengurus.
  assert.deepEqual(dataContoh("2026-11-22").sholatKhusus, []);
  assert.equal(skemaKonten.sholatKhusus.safeParse([item()]).success, true);
});

test("label: tahun Hijriah untuk sholat Ied, tanpa tahun untuk gerhana", () => {
  assert.equal(labelSholatKhusus(item()), "Idul Fitri 1448 H");
  assert.equal(labelSholatKhusus(item({ jenis: "idulAdha", tanggal: "2027-05-16" })), "Idul Adha 1448 H");
  assert.equal(labelSholatKhusus(item({ jenis: "gerhanaMatahari", tanggal: "2026-12-01" })), "Gerhana Matahari");
});

test("jadwal mendatang & judul bagian", () => {
  const daftar = [
    item({ id: "a", tanggal: "2027-05-16", jenis: "idulAdha" }),
    item({ id: "b", tanggal: "2026-11-01", jenis: "gerhanaBulan" }),
    item({ id: "c", tanggal: "2027-03-09" }),
    item({ id: "d", tanggal: "2026-11-22", jam: "19:00", jenis: "gerhanaBulan" }),
  ];
  const mendatang = sholatKhususMendatang(daftar, "2026-11-22");
  assert.deepEqual(
    mendatang.map((x) => x.id),
    ["d", "c", "a"],
  );
  assert.equal(judulBagianSholatKhusus(mendatang), "Sholat Ied & Gerhana");
  assert.equal(judulBagianSholatKhusus([item()]), "Sholat Ied");
  assert.equal(judulBagianSholatKhusus([item({ jenis: "gerhanaMatahari" })]), "Sholat Gerhana");
});

test("poster sholat Ied & gerhana", () => {
  const konteks = konteksPoster(IDENTITAS_BAWAAN, null, "https://masjid.example.com");
  const ied = posterSholatKhusus(item(), null, konteks);
  assert.equal(ied.kategori, "Idul Fitri 1448 H");
  assert.equal(ied.judul, "Sholat Idul Fitri");
  assert.deepEqual(ied.pengisi, { peran: "Khotib", nama: "Ustadz Ahmad Fauzi, Lc.", tambahan: "Imam: Ustadz Fulan", foto: null });
  assert.deepEqual(ied.baris[0], { ikon: "kalender", teks: "Selasa, 9 Maret 2027", sub: "Pukul 06:30 WIB" });
  assert.equal(ied.baris[1].teks, IDENTITAS_BAWAAN.nama);
  assert.equal(ied.namaBerkas, "poster-sholat-idul-fitri-2027-03-09.jpg");
  assert.match(ied.ajakan, /Ied/);
  assert.equal(jenisPosterDariSlug(jalurPoster(ied).split("/")[2]), "sholatKhusus");
  assert.match(teksBagikanPoster(ied), /#sholat-khusus$/);

  const gerhana = posterSholatKhusus(
    item({ jenis: "gerhanaBulan", tanggal: "2026-12-01", jam: "19:30", tema: "Tanda Kebesaran Allah", lokasi: "Halaman masjid", catatan: "Puncak gerhana 19.40 WIB" }),
    null,
    konteks,
  );
  assert.equal(gerhana.kategori, "Gerhana Bulan");
  assert.equal(gerhana.judul, "“Tanda Kebesaran Allah”");
  assert.equal(gerhana.baris[0].sub, "Pukul 19:30 WIB · Puncak gerhana 19.40 WIB");
  assert.deepEqual(gerhana.baris[1], { ikon: "lokasi", teks: "Halaman masjid", sub: "" });
  assert.match(gerhana.ajakan, /gerhana/);
});
