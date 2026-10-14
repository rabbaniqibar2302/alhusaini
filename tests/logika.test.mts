import assert from "node:assert/strict";
import { test } from "node:test";
import { kejadianBerikutnya, penetapanMasukAkal } from "../src/lib/countdown";
import { dariHijriah, formatHijriah, keHijriah } from "../src/lib/hijri";
import { epochWIB, formatTanggal, tanggalBerikutnya, tanggalWIB } from "../src/lib/time";

const tanpaPenetapan = { koreksiHijriah: 0, penetapan: [] };
const denganPenetapan = {
  koreksiHijriah: 0,
  penetapan: [{ acara: "ramadhan" as const, tahunHijriah: 1448, tanggal: "2027-02-09", catatan: "isbat" }],
};

test("perkiraan otomatis 1 Ramadhan dari kalender Hijriah", () => {
  const k = kejadianBerikutnya("ramadhan", "2026-10-14", tanpaPenetapan);
  assert.equal(k[0].tahunHijriah, 1448);
  assert.equal(k[0].tanggal, "2027-02-08");
  assert.equal(k[0].sumber, "otomatis");
  assert.equal(k[1].tahunHijriah, 1449);
});

test("penetapan admin menggantikan perkiraan untuk tahun Hijriah yang sama", () => {
  const k = kejadianBerikutnya("ramadhan", "2026-10-14", denganPenetapan);
  assert.equal(k[0].tanggal, "2027-02-09");
  assert.equal(k[0].sumber, "penetapan");
  // perkiraan (8 Feb) sudah lewat, penetapan (9 Feb) belum
  assert.equal(kejadianBerikutnya("ramadhan", "2027-02-08", denganPenetapan)[0].tanggal, "2027-02-09");
  // hari-H masih menunjuk hari itu
  assert.equal(kejadianBerikutnya("ramadhan", "2027-02-09", denganPenetapan)[0].tanggal, "2027-02-09");
});

test("setelah tanggalnya lewat, pindah ke tahun Hijriah berikutnya", () => {
  const k = kejadianBerikutnya("ramadhan", "2027-02-10", denganPenetapan);
  assert.equal(k[0].tahunHijriah, 1449);
  assert.equal(k[0].sumber, "otomatis");
  assert.equal(kejadianBerikutnya("idul-adha", "2027-05-17", tanpaPenetapan)[0].tahunHijriah, 1449);
});

test("koreksi hari menggeser perkiraan & tanggal Hijriah", () => {
  assert.equal(kejadianBerikutnya("syawwal", "2026-10-14", { koreksiHijriah: 1, penetapan: [] })[0].tanggal, "2027-03-10");
  assert.equal(formatHijriah(keHijriah("2026-10-14")), "3 Jumadil Awal 1448 H");
  assert.equal(formatHijriah(keHijriah("2026-10-14", 1)), "2 Jumadil Awal 1448 H");
});

test("validasi penetapan: maksimal 5 hari dari perkiraan tahun yang dipilih", () => {
  assert.ok(penetapanMasukAkal("ramadhan", 1448, "2027-02-13"));
  assert.ok(!penetapanMasukAkal("ramadhan", 1448, "2027-02-14"));
  assert.ok(!penetapanMasukAkal("ramadhan", 1449, "2027-02-09"));
});

test("konversi Hijriah ↔ Masehi konsisten", () => {
  for (let tahun = 1445; tahun <= 1460; tahun++) {
    for (const [bulan, hari] of [[9, 1], [10, 1], [12, 10]]) {
      const h = keHijriah(dariHijriah(tahun, bulan, hari));
      assert.deepEqual([h.tahun, h.bulan, h.hari], [tahun, bulan, hari]);
    }
  }
});

test("utilitas waktu WIB", () => {
  assert.equal(tanggalWIB(Date.UTC(2026, 9, 14, 17, 0)), "2026-10-15");
  assert.equal(tanggalWIB(Date.UTC(2026, 9, 14, 16, 59)), "2026-10-14");
  assert.equal(epochWIB("2026-10-15", "04:16"), Date.UTC(2026, 9, 14, 21, 16));
  assert.equal(formatTanggal("2026-10-18", { hari: true }), "Ahad, 18 Oktober 2026");
  assert.deepEqual(tanggalBerikutnya("2026-10-16", 5, 2), ["2026-10-16", "2026-10-23"]);
});
