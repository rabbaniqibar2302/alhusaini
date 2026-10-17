import assert from "node:assert/strict";
import { test } from "node:test";
import { kajianDalamRentang, labelWaktuKajian, susunKajian } from "../src/lib/kajian";
import { formatHitungMundur, hitungFase, SETELAN_TV_BAWAAN } from "../src/lib/layar-tv";
import { pengumumanAktif, pengumumanBerakhir } from "../src/lib/pengumuman";
import {
  fotoSchema,
  inputJadwal,
  kegiatanInput,
  pengumumanInput,
  setelanTvSchema,
  skemaKonten,
  type KajianItem,
} from "../src/lib/schemas";
import { cuplikanSejarah } from "../src/lib/sejarah";
import { epochWIB } from "../src/lib/time";
import type { JadwalHarian } from "../src/lib/tipe-jadwal-sholat";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/* ------------------------------ Kajian ------------------------------ */

test("data kajian lama (sebelum ada pilihan tanggal/rutin) tetap terbaca tanpa kehilangan data", () => {
  const subuhLama = [{ id: id(1), hari: "Ahad", ustadz: "Ust. Ahmad", materi: "Tafsir", contoh: true }];
  const ibuLama = [{ id: id(2), hari: "Selasa", jam: "09:00", ustadzah: "Ustadzah Siti", materi: "Tahsin" }];
  const rabuLama = [{ id: id(3), tanggal: "2026-10-21", jam: "19:30", ustadz: "Ust. Ilyas", materi: "Sirah" }];

  const subuh = skemaKonten.kuliahSubuh.parse(subuhLama);
  assert.deepEqual(subuh[0], {
    id: id(1),
    pola: "mingguan",
    tanggal: "",
    hari: "Ahad",
    jam: "",
    ustadz: "Ust. Ahmad",
    materi: "Tafsir",
    contoh: true,
  });
  const ibu = skemaKonten.pengajianIbu.parse(ibuLama);
  assert.equal(ibu[0].pola, "mingguan");
  assert.equal(ibu[0].ustadz, "Ustadzah Siti");
  assert.equal(ibu[0].jam, "09:00");
  assert.equal("ustadzah" in ibu[0], false);
  const rabu = skemaKonten.pengajianRabu.parse(rabuLama);
  assert.equal(rabu[0].pola, "tanggal");
  assert.equal(rabu[0].tanggal, "2026-10-21");
  assert.equal(rabu[0].hari, "");

  // Bentuk baru tetap sama setelah dibaca ulang.
  assert.deepEqual(skemaKonten.kuliahSubuh.parse(subuh), subuh);
});

test("input kajian: tanggal/hari wajib sesuai pilihan, jam sesuai jenis", () => {
  const dasar = { tanggal: "", hari: "", jam: "", ustadz: "Ust. Ahmad", materi: "Tafsir Juz Amma" };

  const tanpaTanggal = inputJadwal.kuliahSubuh.safeParse({ ...dasar, pola: "tanggal" });
  assert.ok(!tanpaTanggal.success);
  assert.deepEqual(tanpaTanggal.error.issues.map((i) => i.path.join(".")), ["tanggal"]);

  const tanpaHari = inputJadwal.pengajianIbu.safeParse({ ...dasar, pola: "mingguan", jam: "09:00" });
  assert.ok(!tanpaHari.success);
  assert.deepEqual(tanpaHari.error.issues.map((i) => i.path.join(".")), ["hari"]);

  const tanpaJam = inputJadwal.pengajianIbu.safeParse({ ...dasar, pola: "tanggal", tanggal: "2026-10-20" });
  assert.ok(!tanpaJam.success);
  assert.deepEqual(tanpaJam.error.issues.map((i) => i.path.join(".")), ["jam"]);

  // Kuliah subuh: jam diabaikan; isian yang tidak dipakai dikosongkan.
  const subuh = inputJadwal.kuliahSubuh.parse({ ...dasar, pola: "tanggal", tanggal: "2026-10-18", hari: "Senin", jam: "05:00" });
  assert.equal(subuh.jam, "");
  assert.equal(subuh.hari, "");
  const rutin = inputJadwal.pengajianIbu.parse({ ...dasar, pola: "mingguan", tanggal: "2026-10-18", hari: "Kamis", jam: "13:30" });
  assert.equal(rutin.tanggal, "");
  assert.equal(rutin.hari, "Kamis");

  assert.ok(!inputJadwal.pengajianRabu.safeParse({ ...dasar, pola: "harian", tanggal: "2026-10-21", jam: "19:30" }).success);
});

const kajian = (x: Partial<KajianItem> & { id: string }): KajianItem => ({
  pola: "tanggal",
  tanggal: "",
  hari: "",
  jam: "",
  ustadz: "Ust. A",
  materi: "Materi",
  ...x,
});

test("susunan kajian: bertanggal terdekat dulu (yang lewat disembunyikan), lalu rutin per hari", () => {
  const items = [
    kajian({ id: id(1), pola: "mingguan", hari: "Kamis", jam: "13:30" }),
    kajian({ id: id(2), tanggal: "2026-10-25" }),
    kajian({ id: id(3), tanggal: "2026-10-10" }),
    kajian({ id: id(4), pola: "mingguan", hari: "Senin" }),
    kajian({ id: id(5), tanggal: "2026-10-18" }),
  ];
  assert.deepEqual(
    susunKajian(items, "2026-10-17").map((x) => x.id),
    [id(5), id(2), id(4), id(1)],
  );
  assert.equal(labelWaktuKajian(items[0]), "Setiap Kamis");
  assert.equal(labelWaktuKajian(items[1]), "Ahad, 25 Oktober 2026");
});

test("kajian 7 hari ke depan untuk layar TV", () => {
  const hasil = kajianDalamRentang(
    {
      pengajianRabu: [kajian({ id: id(1), tanggal: "2026-10-21", jam: "19:30" })],
      kuliahSubuh: [
        kajian({ id: id(2), pola: "mingguan", hari: "Rabu" }),
        kajian({ id: id(3), tanggal: "2026-10-30" }), // di luar rentang
      ],
      pengajianIbu: [kajian({ id: id(4), pola: "mingguan", hari: "Sabtu", jam: "09:00" })],
    },
    "2026-10-17", // Sabtu
    7,
  );
  assert.deepEqual(
    hasil.map((k) => [k.tanggal, k.jenis]),
    [
      ["2026-10-17", "pengajianIbu"],
      ["2026-10-21", "kuliahSubuh"], // tanpa jam = ba'da subuh, paling pagi
      ["2026-10-21", "pengajianRabu"],
    ],
  );
});

/* ------------------------------ Layar TV ------------------------------ */

const jadwalJumat: JadwalHarian = {
  tanggal: "2026-10-16", // Jumat
  imsak: "04:05",
  subuh: "04:15",
  terbit: "05:30",
  dzuhur: "11:43",
  ashar: "15:01",
  maghrib: "17:52",
  isya: "19:03",
  sumber: "kemenag",
  lokasi: "KOTA JAKARTA",
};
const jadwalKamis: JadwalHarian = { ...jadwalJumat, tanggal: "2026-10-15" };
const besok = { tanggal: "2026-10-17", subuh: "04:14" };
const pada = (tanggal: string, jam: string, tambahDetik = 0) => epochWIB(tanggal, jam) + tambahDetik * 1000;

test("fase layar TV: menuju adzan → iqomah → sholat → menuju waktu berikutnya", () => {
  const s = SETELAN_TV_BAWAAN;
  const f1 = hitungFase(pada("2026-10-15", "03:00"), jadwalKamis, besok, s);
  assert.equal(f1.jenis, "normal");
  assert.equal(f1.jenis === "normal" && f1.berikut.kunci, "subuh");

  const f2 = hitungFase(pada("2026-10-15", "04:20"), jadwalKamis, besok, s);
  assert.equal(f2.jenis, "iqomah");
  assert.equal(f2.jenis === "iqomah" && f2.selesai, pada("2026-10-15", "04:25"));

  const f3 = hitungFase(pada("2026-10-15", "04:30"), jadwalKamis, besok, s);
  assert.equal(f3.jenis, "sholat");

  const f4 = hitungFase(pada("2026-10-15", "04:36"), jadwalKamis, besok, s);
  assert.equal(f4.jenis === "normal" && f4.berikut.kunci, "dzuhur");
  assert.equal(f4.jenis === "normal" && f4.berikut.label, "Dzuhur");

  const malam = hitungFase(pada("2026-10-15", "21:00"), jadwalKamis, { ...besok, tanggal: "2026-10-16" }, s);
  assert.equal(malam.jenis === "normal" && malam.berikut.epoch, pada("2026-10-16", "04:14"));

  const tanpaIqomah = { ...s, iqomahSubuh: 0, durasiSholat: 0 };
  const f5 = hitungFase(pada("2026-10-15", "04:16"), jadwalKamis, besok, tanpaIqomah);
  assert.equal(f5.jenis === "normal" && f5.berikut.kunci, "dzuhur");
});

test("fase layar TV: hari Jumat menampilkan layar khutbah, bukan iqomah", () => {
  const s = SETELAN_TV_BAWAAN;
  const sebelum = hitungFase(pada("2026-10-16", "11:00"), jadwalJumat, besok, s);
  assert.equal(sebelum.jenis === "normal" && sebelum.berikut.label, "Jumat");
  const khutbah = hitungFase(pada("2026-10-16", "12:00"), jadwalJumat, besok, s);
  assert.equal(khutbah.jenis, "jumat");
  assert.equal(khutbah.jenis === "jumat" && khutbah.selesai, pada("2026-10-16", "12:28"));
  const sesudah = hitungFase(pada("2026-10-16", "12:30"), jadwalJumat, besok, s);
  assert.equal(sesudah.jenis === "normal" && sesudah.berikut.kunci, "ashar");
});

test("format hitung mundur", () => {
  assert.equal(formatHitungMundur(3_725_000), "01:02:05");
  assert.equal(formatHitungMundur(599_100, true), "10:00");
  assert.equal(formatHitungMundur(-5), "00:00:00");
});

test("pengaturan TV: angka dari form divalidasi", () => {
  const isian = { iqomahSubuh: "10", iqomahDzuhur: "8", iqomahAshar: "8", iqomahMaghrib: "5", iqomahIsya: "8", durasiSholat: "10", durasiJumat: "45", detikSlide: "15" };
  assert.equal(setelanTvSchema.parse(isian).iqomahSubuh, 10);
  assert.ok(!setelanTvSchema.safeParse({ ...isian, iqomahSubuh: "" }).success);
  assert.ok(!setelanTvSchema.safeParse({ ...isian, iqomahAshar: "31" }).success);
  assert.ok(!setelanTvSchema.safeParse({ ...isian, detikSlide: "2" }).success);
  assert.ok(!setelanTvSchema.safeParse({ ...isian, durasiJumat: "1.5" }).success);
});

/* -------------------------- Pengumuman & konten -------------------------- */

test("pengumuman aktif sesuai periode tampil", () => {
  const items = [
    { mulai: "", sampai: "", teks: "a" },
    { mulai: "2026-10-20", sampai: "", teks: "b" },
    { mulai: "", sampai: "2026-10-16", teks: "c" },
    { mulai: "2026-10-10", sampai: "2026-10-17", teks: "d" },
  ];
  assert.deepEqual(pengumumanAktif(items, "2026-10-17").map((x) => x.teks), ["a", "d"]);
  assert.ok(pengumumanBerakhir(items[2], "2026-10-17"));
  assert.ok(!pengumumanBerakhir(items[0], "2026-10-17"));

  const salah = pengumumanInput.safeParse({ teks: "Kerja bakti", mulai: "2026-10-20", sampai: "2026-10-19", diWebsite: false });
  assert.ok(!salah.success);
  assert.deepEqual(salah.error.issues[0].path, ["sampai"]);
});

test("teks panjang: baris baru dirapikan, karakter kontrol ditolak", () => {
  const ok = kegiatanInput.parse({
    judul: "Santunan anak yatim",
    tanggal: "2026-10-17",
    keterangan: "Paragraf satu.\r\nMasih paragraf satu.   \r\n\r\n\r\n\r\nParagraf dua.\t ",
  });
  assert.equal(ok.keterangan, "Paragraf satu.\nMasih paragraf satu.\n\nParagraf dua.");
  assert.ok(!kegiatanInput.safeParse({ judul: "Santunan", tanggal: "2026-10-17", keterangan: "bunyi\u0007" }).success);
  assert.ok(!kegiatanInput.safeParse({ judul: "Santunan\nyatim", tanggal: "2026-10-17", keterangan: "" }).success);
});

test("URL foto: hanya folder Blob yang dikenal", () => {
  const foto = (url: string) => fotoSchema.safeParse({ url, pathname: "x", lebar: 10, tinggi: 10 }).success;
  const dasar = "https://abc123.public.blob.vercel-storage.com/masjid";
  const uuid = "0f1e2d3c-4b5a-4968-8776-655443322110";
  for (const folder of ["hero", "legalitas", "galeri", "logo", "kegiatan", "sejarah"]) {
    assert.ok(foto(`${dasar}/${folder}/${uuid}.webp`), folder);
  }
  assert.ok(!foto(`${dasar}/lain/${uuid}.webp`));
  assert.ok(!foto(`${dasar}/logo/${uuid}.svg`));
  assert.ok(!foto(`https://evil.example.com/masjid/logo/${uuid}.webp`));
});

test("cuplikan sejarah untuk halaman depan", () => {
  const p1 = "Masjid ini didirikan oleh warga.".repeat(5); // 160 karakter
  const narasi = [p1, p1, p1, p1, p1].join("\n\n");
  const c = cuplikanSejarah(narasi, 400);
  assert.equal(c.paragraf.length, 2);
  assert.ok(c.terpotong);
  assert.deepEqual(cuplikanSejarah("Satu paragraf saja.", 400), { paragraf: ["Satu paragraf saja."], terpotong: false });
  const panjang = cuplikanSejarah("kata ".repeat(300), 100);
  assert.ok(panjang.terpotong && panjang.paragraf[0].endsWith("…") && panjang.paragraf[0].length <= 101);
});
