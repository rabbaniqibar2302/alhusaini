import assert from "node:assert/strict";
import { test } from "node:test";
import { hitungJadwalLokal, pilihKota, uraikanJadwal } from "../src/server/jadwal-sholat";

const hari = { imsak: "04:06", subuh: "04:16", terbit: "05:31", dhuha: "05:58", dzuhur: "11:42", ashar: "14:45", maghrib: "17:48", isya: "18:57" };

test("respons API myQuran v2 (satu hari & bulanan)", () => {
  const v2 = { status: true, data: { lokasi: "KOTA JAKARTA", jadwal: { tanggal: "Rabu, 14/10/2026", ...hari, date: "2026-10-14" } } };
  assert.equal(uraikanJadwal(v2, "2026-10-14")?.waktu.subuh, "04:16");
  assert.equal(uraikanJadwal(v2, "2026-10-14")?.lokasi, "KOTA JAKARTA");
  assert.equal(uraikanJadwal(v2, "2026-10-15"), null);
  const bulanan = { status: true, data: { jadwal: [{ ...hari, subuh: "04:17", date: "2026-10-13" }, { ...hari, date: "2026-10-14" }] } };
  assert.equal(uraikanJadwal(bulanan, "2026-10-14")?.waktu.subuh, "04:16");
});

test("respons API myQuran v3 (objek per tanggal & format jam longgar)", () => {
  const v3 = { status: true, data: { kabko: "KOTA JAKARTA", jadwal: { "2026-10-14": hari } } };
  assert.equal(uraikanJadwal(v3, "2026-10-14")?.waktu.isya, "18:57");
  const longgar = { status: true, data: { jadwal: { ...hari, tanggal: "2026-10-14", subuh: "4:16", imsak: "04:06:00" } } };
  assert.equal(uraikanJadwal(longgar, "2026-10-14")?.waktu.subuh, "04:16");
  assert.equal(uraikanJadwal(longgar, "2026-10-14")?.waktu.imsak, "04:06");
});

test("respons rusak ditolak", () => {
  assert.equal(uraikanJadwal({ status: false, message: "Data tidak ditemukan." }, "2026-10-14"), null);
  assert.equal(uraikanJadwal({ status: true, data: { jadwal: { ...hari, subuh: "xx" } } }, "2026-10-14"), null);
  assert.equal(uraikanJadwal("<html>", "2026-10-14"), null);
});

test("pemilihan kota Jakarta Pusat dari hasil pencarian", () => {
  assert.equal(pilihKota({ data: [{ id: "1302", lokasi: "KAB. KEPULAUAN SERIBU" }, { id: "1301", lokasi: "KOTA JAKARTA" }] })?.id, "1301");
  assert.equal(pilihKota({ data: [{ id: "a", lokasi: "KOTA JAKARTA BARAT" }, { id: "b", lokasi: "KOTA JAKARTA PUSAT" }] })?.id, "b");
  assert.equal(pilihKota({ data: [] }), null);
});

test("perhitungan cadangan (metode Kemenag) menghasilkan urutan waktu yang benar", () => {
  const w = hitungJadwalLokal("2026-10-14");
  const urutan = [w.imsak, w.subuh, w.terbit, w.dzuhur, w.ashar, w.maghrib, w.isya];
  urutan.forEach((jam) => assert.match(jam, /^\d\d:\d\d$/));
  assert.deepEqual([...urutan].sort(), urutan);
});
