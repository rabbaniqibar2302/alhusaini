import assert from "node:assert/strict";
import { test } from "node:test";
import { agendaLewat, agendaMendatang, hitungMundurAgenda, labelTanggalAgenda } from "../src/lib/agenda";
import { dataContoh } from "../src/lib/data-contoh";
import { adaInfak, nomorPolos } from "../src/lib/infak";
import { formatRupiah, geserBulan, ringkasanKas } from "../src/lib/kas";
import { agendaInput, infakTeksSchema, rupiahSchema, setelanKasSchema, transaksiKasInput, type TransaksiKas } from "../src/lib/schemas";

let n = 0;
const t = (tanggal: string, jenis: "masuk" | "keluar", jumlah: number): TransaksiKas => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  tanggal,
  jenis,
  keterangan: "uji",
  jumlah,
});

test("rupiah: format & input bertitik", () => {
  assert.equal(formatRupiah(1250000), "Rp 1.250.000");
  assert.equal(formatRupiah(-5000), "−Rp 5.000");
  assert.equal(rupiahSchema.parse("1.250.000"), 1250000);
  assert.equal(rupiahSchema.parse("Rp 50.000"), 50000);
  assert.equal(rupiahSchema.parse("rp. 7 500"), 7500);
  for (const salah of ["", "1.250,50", "abc", "-5000", "12e3"]) {
    assert.equal(rupiahSchema.safeParse(salah).success, false, salah);
  }
  assert.equal(transaksiKasInput.safeParse({ tanggal: "2026-10-01", jenis: "masuk", keterangan: "Infak", jumlah: "0" }).success, false);
  assert.equal(transaksiKasInput.safeParse({ tanggal: "2026-10-01", jenis: "pinjam", keterangan: "Infak", jumlah: "5" }).success, false);
});

test("geser bulan melewati pergantian tahun", () => {
  assert.equal(geserBulan("2026-01", -1), "2025-12");
  assert.equal(geserBulan("2026-10", -11), "2025-11");
  assert.equal(geserBulan("2025-12", 1), "2026-01");
});

test("ringkasan kas: saldo awal periode memperhitungkan transaksi sebelum periode", () => {
  const daftar = [
    t("2026-06-15", "masuk", 1_000_000), // sebelum periode 3 bulan (Agu–Okt)
    t("2026-07-31", "keluar", 200_000), // sebelum periode
    t("2026-08-01", "masuk", 500_000),
    t("2026-09-10", "keluar", 150_000),
    t("2026-10-02", "masuk", 300_000),
    t("2026-10-05", "keluar", 50_000),
  ];
  const r = ringkasanKas(daftar, { saldoAwal: 2_000_000, periodeBulan: 3 }, "2026-10-17");
  assert.equal(r.periodeLabel, "Agustus 2026 – Oktober 2026");
  assert.equal(r.saldoAwal, 2_800_000);
  assert.equal(r.masuk, 800_000);
  assert.equal(r.keluar, 200_000);
  assert.equal(r.saldoAkhir, 3_400_000);
  assert.deepEqual(
    r.bulan.map((b) => [b.bulan, b.saldoAwal, b.saldoAkhir]),
    [
      ["2026-10", 3_150_000, 3_400_000],
      ["2026-09", 3_300_000, 3_150_000],
      ["2026-08", 2_800_000, 3_300_000],
    ],
  );
  assert.equal(r.terakhir, "2026-10-05");
  // Transaksi terbaru di atas dalam satu bulan.
  assert.deepEqual(r.bulan[0].transaksi.map((x) => x.tanggal), ["2026-10-05", "2026-10-02"]);

  const sebulan = ringkasanKas(daftar, { saldoAwal: 0, periodeBulan: 1 }, "2026-10-17");
  assert.equal(sebulan.periodeLabel, "Oktober 2026");
  assert.equal(sebulan.bulan.length, 1);
  assert.equal(sebulan.saldoAkhir, 1_400_000);
});

test("setelan kas: hanya periode yang tersedia", () => {
  const dasar = { saldoAwal: "0", tampilWebsite: true, tampilTv: false };
  assert.equal(setelanKasSchema.parse({ ...dasar, periodeBulan: "6" }).periodeBulan, 6);
  assert.equal(setelanKasSchema.safeParse({ ...dasar, periodeBulan: "5" }).success, false);
  assert.deepEqual(dataContoh("2026-10-17").kas, []);
});

test("agenda: mendatang, lewat, label tanggal & hitung mundur", () => {
  const a = { tanggal: "2026-10-24", tanggalSelesai: "" };
  const b = { tanggal: "2026-10-16", tanggalSelesai: "2026-10-18" };
  const c = { tanggal: "2026-10-10", tanggalSelesai: "" };
  assert.deepEqual(agendaMendatang([a, c, b], "2026-10-17"), [b, a]);
  assert.equal(agendaLewat(c, "2026-10-17"), true);
  assert.equal(hitungMundurAgenda(a, "2026-10-17"), "7 hari lagi");
  assert.equal(hitungMundurAgenda({ tanggal: "2026-10-18", tanggalSelesai: "" }, "2026-10-17"), "Besok");
  assert.equal(hitungMundurAgenda(b, "2026-10-17"), "Sedang berlangsung");
  assert.equal(labelTanggalAgenda(a), "Sabtu, 24 Okt 2026");
  assert.equal(labelTanggalAgenda(b), "16–18 Okt 2026");
  assert.equal(labelTanggalAgenda({ tanggal: "2026-10-30", tanggalSelesai: "2026-11-01" }), "30 Okt – 1 Nov 2026");
  assert.equal(labelTanggalAgenda({ tanggal: "2026-12-31", tanggalSelesai: "2027-01-01" }), "31 Des 2026 – 1 Jan 2027");

  const isian = { judul: "Tabligh Akbar", tanggal: "2026-10-24", tanggalSelesai: "", jam: "", lokasi: "", keterangan: "" };
  assert.equal(agendaInput.safeParse(isian).success, true);
  assert.equal(agendaInput.safeParse({ ...isian, tanggalSelesai: "2026-10-20" }).success, false);
  assert.equal(agendaInput.safeParse({ ...isian, jam: "25:00" }).success, false);
});

test("infak: rekening divalidasi, QRIS saja juga cukup", () => {
  const rek = { id: "00000000-0000-4000-8000-000000000001", bank: "BSI", nomor: "7123 4567-89", atasNama: "DKM Al Husaini" };
  const dasar = { namaQris: "", catatan: "", tampilTv: true };
  assert.equal(infakTeksSchema.safeParse({ ...dasar, rekening: [rek] }).success, true);
  assert.equal(infakTeksSchema.safeParse({ ...dasar, rekening: [{ ...rek, nomor: "12ab" }] }).success, false);
  assert.equal(infakTeksSchema.safeParse({ ...dasar, rekening: Array(6).fill(rek) }).success, false);
  assert.equal(nomorPolos("7123 4567-89"), "7123456789");
  assert.equal(adaInfak({ rekening: [], qris: null }), false);
  assert.equal(adaInfak({ rekening: [], qris: { url: "/images/x.svg", pathname: null, lebar: 1, tinggi: 1 } }), true);
});
