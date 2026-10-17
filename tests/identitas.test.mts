import assert from "node:assert/strict";
import { test } from "node:test";
import { dataContoh } from "../src/lib/data-contoh";
import { identitasSchema, skemaKonten } from "../src/lib/schemas";
import { IDENTITAS_BAWAAN, alamatPendek, deskripsiSitus, namaDenganWilayah, urlMaps } from "../src/lib/site";

const masukan = {
  nama: "  Masjid Al-Ikhlas ",
  namaArab: "مسجد الإخلاص",
  wilayah: "Menteng, Jakarta Pusat",
  alamat: "Jl. Contoh No. 1,\r\n  Menteng, Jakarta Pusat",
  alamatSingkat: "",
};

/** Field yang ditolak validasi (null bila lolos). */
function ditolak(ubah: Partial<typeof masukan>): string[] | null {
  const hasil = identitasSchema.safeParse({ ...masukan, ...ubah });
  return hasil.success ? null : hasil.error.issues.map((i) => i.path.join("."));
}

test("identitas bawaan lolos validasi dan dipakai selama belum diubah admin", () => {
  assert.deepEqual(skemaKonten.identitas.parse(IDENTITAS_BAWAAN), IDENTITAS_BAWAAN);
  assert.deepEqual(dataContoh("2026-10-17").identitas, IDENTITAS_BAWAAN);
});

test("identitas: spasi dirapikan, baris alamat digabung, nama Arab & wilayah boleh kosong", () => {
  const x = identitasSchema.parse(masukan);
  assert.equal(x.nama, "Masjid Al-Ikhlas");
  assert.equal(x.alamat, "Jl. Contoh No. 1, Menteng, Jakarta Pusat");
  assert.equal(ditolak({ namaArab: "" }), null);
  assert.equal(ditolak({ wilayah: "" }), null);
  assert.equal(ditolak({ alamatSingkat: "Jl. Contoh No. 1" }), null);
});

test("identitas: isian yang tidak sesuai ditolak", () => {
  assert.deepEqual(ditolak({ nama: "Ab" }), ["nama"]);
  assert.deepEqual(ditolak({ nama: "x".repeat(61) }), ["nama"]);
  assert.deepEqual(ditolak({ nama: "Masjid\u0000Al-Ikhlas" }), ["nama"]);
  // Nama Arab harus berhuruf Arab (mencegah nama Latin tertulis di kolom Arab).
  assert.deepEqual(ditolak({ namaArab: "Masjid Al-Ikhlas" }), ["namaArab"]);
  assert.deepEqual(ditolak({ alamat: "Jl. A" }), ["alamat"]);
  assert.deepEqual(ditolak({ alamatSingkat: "x".repeat(101) }), ["alamatSingkat"]);
});

test("turunan identitas: alamat pendek, judul, deskripsi, dan tautan Google Maps", () => {
  const x = identitasSchema.parse(masukan);
  // Alamat singkat kosong: layar TV & Google Maps memakai alamat lengkap.
  assert.equal(alamatPendek(x), x.alamat);
  assert.equal(alamatPendek({ ...x, alamatSingkat: "Jl. Contoh No. 1" }), "Jl. Contoh No. 1");
  assert.equal(namaDenganWilayah(x, " — "), "Masjid Al-Ikhlas — Menteng, Jakarta Pusat");
  assert.equal(namaDenganWilayah({ ...x, wilayah: "" }), "Masjid Al-Ikhlas");
  assert.match(deskripsiSitus(x), /^Website resmi Masjid Al-Ikhlas, Menteng, Jakarta Pusat: /);
  const maps = new URL(urlMaps({ ...x, alamatSingkat: "Jl. Contoh No. 1" }));
  assert.equal(maps.hostname, "www.google.com");
  assert.equal(maps.searchParams.get("query"), "Masjid Al-Ikhlas, Jl. Contoh No. 1");
});
