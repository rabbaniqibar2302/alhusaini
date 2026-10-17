import assert from "node:assert/strict";
import { test } from "node:test";
import { dataContoh } from "../src/lib/data-contoh";
import { fotoUntuk, inisialNama, kunciNama, petaFotoPenceramah } from "../src/lib/penceramah";
import { penceramahItem, skemaKonten, type PenceramahItem } from "../src/lib/schemas";

const URL_FOTO = "https://abc123.public.blob.vercel-storage.com/masjid/penceramah/0b9f4c4e-8c3e-4f7e-9d3a-2a1b3c4d5e6f.webp";

const contoh: PenceramahItem = {
  id: "6a1f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
  nama: "Ust. H. Ahmad Fauzi, Lc.",
  foto: { url: URL_FOTO, pathname: "masjid/penceramah/0b9f4c4e-8c3e-4f7e-9d3a-2a1b3c4d5e6f.webp", lebar: 800, tinggi: 1000 },
  latarDihapus: true,
};

test("kunci nama: gelar depan, gelar akademik, titik, dan huruf besar diabaikan", () => {
  const sama = [
    "Ust. H. Ahmad Fauzi, Lc.",
    "Ustadz Ahmad Fauzi",
    "ust ahmad fauzi",
    "KH. Ahmad Fauzi, M.A.",
    "K.H. Ahmad  Fauzi",
    "Dr. H. Ahmad Fauzi",
  ];
  for (const n of sama) assert.equal(kunciNama(n), "ahmad fauzi", n);
  assert.equal(kunciNama("Ustadzah Hj. Siti Aminah"), "siti aminah");
  assert.equal(kunciNama("KH. Abdurrahman Syafi'i"), "abdurrahman syafii");
  // Orang berbeda tetap berbeda; sapaan yang menjadi bagian nama (Habib) tidak dibuang.
  assert.notEqual(kunciNama("Ust. Ahmad Fauzi"), kunciNama("Ust. Ahmad Fauzan"));
  assert.equal(kunciNama("Habib Umar"), "habib umar");
  // Nama yang hanya berupa sapaan tidak menjadi kosong.
  assert.equal(kunciNama("Ustadz"), "ustadz");
});

test("inisial nama tanpa gelar", () => {
  assert.equal(inisialNama("Ust. H. Ahmad Fauzi, Lc."), "AF");
  assert.equal(inisialNama("Ustadzah Rahmawati"), "R");
  assert.equal(inisialNama("Dr. Hasan Basri Nasution"), "HB");
});

test("foto dicocokkan lewat nama, termasuk nama yang ditulis berbeda", () => {
  const peta = petaFotoPenceramah([contoh]);
  assert.deepEqual(fotoUntuk(peta, "Ustadz Ahmad Fauzi"), { url: URL_FOTO, lebar: 800, tinggi: 1000, latarDihapus: true });
  assert.equal(fotoUntuk(peta, "Ust. Hamdan Fikri"), null);
  // Kunci bawaan objek JavaScript tidak dianggap sebagai foto.
  assert.equal(fotoUntuk(peta, "constructor"), null);
  assert.equal(fotoUntuk(peta, "__proto__"), null);
});

test("skema penceramah: hanya foto dari folder penceramah di Blob, data contoh kosong", () => {
  assert.deepEqual(penceramahItem.parse(contoh), contoh);
  const urlLain = { ...contoh, foto: { ...contoh.foto, url: URL_FOTO.replace("/penceramah/", "/rahasia/") } };
  assert.equal(penceramahItem.safeParse(urlLain).success, false);
  assert.equal(penceramahItem.safeParse({ ...contoh, nama: "Al" }).success, false);
  assert.equal(penceramahItem.safeParse({ ...contoh, latarDihapus: "ya" }).success, false);
  assert.deepEqual(dataContoh("2026-10-17").penceramah, []);
  assert.equal(skemaKonten.penceramah.safeParse(Array.from({ length: 101 }, () => contoh)).success, false);
});
