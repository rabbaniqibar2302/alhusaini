import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dataContoh } from "../src/lib/data-contoh";
import { konteksPoster, posterKhotib, versiPoster } from "../src/lib/poster";
import type { AgendaItem, KajianItem, KhotibItem, SholatKhususItem } from "../src/lib/schemas";
import { tampilanInput, tampilanSchema } from "../src/lib/schemas";
import { itemSegera, labelWaktuSegera, sorotanSholatKhusus } from "../src/lib/segera";
import { formatDurasi, jadwalUntuk, sholatBerikutnya } from "../src/lib/sholat-berikutnya";
import { IDENTITAS_BAWAAN } from "../src/lib/site";
import { KUNCI_TEMA, TEMA, TEMA_BAWAAN, TINGKAT, rgba, variabelTema, warna, type Tingkat } from "../src/lib/tema";
import type { JadwalHarian } from "../src/lib/tipe-jadwal-sholat";
import { epochWIB, singkatanHari } from "../src/lib/time";

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminans(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function kontras(a: string, b: string): number {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* --------------------------------- Tema --------------------------------- */

test("tema: setiap tema lengkap dengan warna hex yang valid", () => {
  assert.ok(KUNCI_TEMA.includes(TEMA_BAWAAN));
  for (const kunci of KUNCI_TEMA) {
    const t = TEMA[kunci];
    assert.ok(t.nama.length > 0 && t.deskripsi.length > 0, kunci);
    for (const ramp of [t.utama, t.aksen]) {
      assert.equal(ramp.length, TINGKAT.length, kunci);
      for (const w of ramp) assert.match(w, /^#[0-9a-f]{6}$/, `${kunci} ${w}`);
    }
    assert.match(t.krem, /^#[0-9a-f]{6}$/);
  }
});

test("tema: nilai bawaan sama dengan @theme di globals.css", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const nilai = (nama: string) => css.match(new RegExp(`--color-${nama}:\\s*(#[0-9a-f]{6});`))?.[1];
  const bawaan = TEMA[TEMA_BAWAAN];
  for (const t of TINGKAT) {
    assert.equal(nilai(`utama-${t}`), warna(bawaan, "utama", t), `utama-${t}`);
    assert.equal(nilai(`aksen-${t}`), warna(bawaan, "aksen", t), `aksen-${t}`);
  }
  assert.equal(nilai("krem"), bawaan.krem);
});

test("tema: kecerahan tiap tingkat setara tema bawaan, kontras teks terjaga", () => {
  const bawaan = TEMA[TEMA_BAWAAN];
  for (const kunci of KUNCI_TEMA) {
    const t = TEMA[kunci];
    for (const tingkat of TINGKAT) {
      for (const ramp of ["utama", "aksen"] as const) {
        const [a, b] = [luminans(warna(t, ramp, tingkat)), luminans(warna(bawaan, ramp, tingkat))];
        assert.ok(Math.abs(a - b) / Math.max(b, 0.01) < 0.2, `${kunci} ${ramp}-${tingkat}`);
      }
    }
    const u = (n: Tingkat) => warna(t, "utama", n);
    const a = (n: Tingkat) => warna(t, "aksen", n);
    // Tombol utama, teks di kartu gelap, judul di latar krem, label pil, sorotan di kartu gelap.
    assert.ok(kontras(a(400), u(950)) >= 7, `${kunci} tombol`);
    assert.ok(kontras("#ffffff", u(900)) >= 7, `${kunci} putih/utama-900`);
    assert.ok(kontras(u(900), t.krem) >= 7, `${kunci} judul`);
    assert.ok(kontras(a(700), a(50)) >= 4.5, `${kunci} pil`);
    assert.ok(kontras(a(300), u(900)) >= 4.5, `${kunci} sorotan`);
  }
});

test("tema: variabel CSS untuk <html> dan warna untuk poster", () => {
  const v = variabelTema("samudra");
  for (const t of TINGKAT) {
    assert.equal(v[`--color-utama-${t}`], warna(TEMA.samudra, "utama", t));
    assert.equal(v[`--color-aksen-${t}`], warna(TEMA.samudra, "aksen", t));
  }
  assert.equal(v["--color-krem"], TEMA.samudra.krem);
  // Pola bintang memakai warna aksen tema (di-encode di dalam data URI).
  assert.ok(v["--pola-islami"].includes(encodeURIComponent(warna(TEMA.samudra, "aksen", 400))));
  assert.equal(rgba("#dcaa31", 0.4), "rgba(220,170,49,0.4)");
});

test("tema: skema pengaturan tampilan", () => {
  assert.equal(tampilanInput.safeParse({ tema: "samudra" }).success, true);
  assert.equal(tampilanInput.safeParse({ tema: "pelangi" }).success, false);
  assert.equal(tampilanInput.safeParse({}).success, false);
  // Tema tersimpan yang tidak dikenal (mis. sudah dihapus) kembali ke bawaan, bukan merusak halaman.
  assert.deepEqual(tampilanSchema.parse({ tema: "pelangi" }), { tema: TEMA_BAWAAN });
  assert.deepEqual(dataContoh("2026-11-22").tampilan, { tema: TEMA_BAWAAN });
});

test("tema: poster ikut tema dan tautannya berganti saat tema diganti", () => {
  const khotib: KhotibItem = {
    id: "9d4f0c64-5d0e-4b6a-9b8e-1f2a3b4c5d6e",
    tanggal: "2026-11-27",
    khotib: "Ust. H. Ahmad Fauzi, Lc.",
    imam: "",
    tema: "",
  };
  const situs = "https://masjid.example.com";
  const bawaan = posterKhotib(khotib, null, konteksPoster(IDENTITAS_BAWAAN, null, situs));
  const biru = posterKhotib(khotib, null, konteksPoster(IDENTITAS_BAWAAN, null, situs, "samudra"));
  assert.equal(bawaan.tema, TEMA_BAWAAN);
  assert.equal(biru.tema, "samudra");
  assert.notEqual(versiPoster(bawaan), versiPoster(biru));
});

/* -------------------------- Pita "Segera di masjid" -------------------------- */

test("segera: jadwal terdekat dari semua jenis, tanpa data contoh, berurutan", () => {
  const hariIni = "2026-11-22"; // Ahad
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const kajian = (x: Partial<KajianItem>): KajianItem => ({
    id: id(90),
    pola: "mingguan",
    tanggal: "",
    hari: "Rabu",
    jam: "19:30",
    ustadz: "Ust. Ahmad",
    materi: "Riyadhus Shalihin",
    ...x,
  });
  const sholat: SholatKhususItem = {
    id: id(1),
    jenis: "gerhanaBulan",
    tanggal: "2026-12-01",
    jam: "19:30",
    khotib: "Ust. Hasan",
    imam: "",
    tema: "",
    lokasi: "",
    catatan: "",
  };
  const agenda: AgendaItem = {
    id: id(2),
    judul: "Tabligh Akbar",
    tanggal: "2026-11-29",
    tanggalSelesai: "",
    jam: "19:30",
    lokasi: "Halaman masjid",
    keterangan: "",
    poster: null,
  };
  const items = itemSegera(
    {
      sholatKhusus: [sholat, { ...sholat, id: id(3), tanggal: "2027-03-09", jenis: "idulFitri" }],
      agenda: [agenda, { ...agenda, id: id(4), judul: "Contoh", contoh: true }],
      khotib: [
        { id: id(5), tanggal: "2026-11-27", khotib: "Ust. Fauzi", imam: "", tema: "" },
        { id: id(6), tanggal: "2026-11-20", khotib: "Sudah lewat", imam: "", tema: "" },
      ],
      pengajianRabu: [kajian({}), kajian({ id: id(7), ustadz: "Contoh", contoh: true })],
      kuliahSubuh: [kajian({ id: id(8), hari: "Ahad", jam: "", ustadz: "Ust. Subuh" })],
      pengajianIbu: [],
    },
    hariIni,
  );
  // Kajian hanya 7 hari (kuliah subuh Ahad depan, 29 Nov, sudah di luar); Idul Fitri masih jauh.
  assert.deepEqual(
    items.map((x) => `${x.tanggal} ${x.jenis}`),
    ["2026-11-22 kajian", "2026-11-25 kajian", "2026-11-27 jumat", "2026-11-29 agenda", "2026-12-01 sholatKhusus"],
  );
  assert.ok(!items.some((x) => x.keterangan === "Contoh" || x.judul === "Contoh"));
  assert.equal(items.find((x) => x.jenis === "jumat")?.bagian, "khotib");

  assert.equal(labelWaktuSegera({ tanggal: "2026-11-22", jam: "" }, hariIni), "Hari ini");
  assert.equal(labelWaktuSegera({ tanggal: "2026-11-23", jam: "05:00" }, hariIni), "Besok · 05:00");
  assert.equal(labelWaktuSegera({ tanggal: "2026-11-29", jam: "19:30" }, hariIni), "Ahad, 29 Nov · 19:30");
  assert.equal(singkatanHari("Ahad"), "Ahad");
  assert.equal(singkatanHari("Rabu"), "Rab");

  assert.deepEqual(sorotanSholatKhusus([sholat], hariIni), {
    label: "Segera",
    teks: "Gerhana Bulan · Selasa, 1 Desember",
    href: "#sholat-khusus",
  });
  assert.equal(sorotanSholatKhusus([sholat], "2026-12-01")?.label, "Hari ini");
  assert.equal(sorotanSholatKhusus([{ ...sholat, tanggal: "2027-03-09" }], hariIni), null);
});

/* ---------------------------- Sholat berikutnya ---------------------------- */

const jadwal = (tanggal: string, x: Partial<JadwalHarian> = {}): JadwalHarian => ({
  tanggal,
  imsak: "04:00",
  subuh: "04:10",
  terbit: "05:25",
  dzuhur: "11:45",
  ashar: "15:05",
  maghrib: "17:55",
  isya: "19:08",
  sumber: "kemenag",
  lokasi: "",
  ...x,
});

test("sholat berikutnya: urutan waktu, label Jumat, dan Subuh esok hari", () => {
  const hari = [jadwal("2026-11-27"), jadwal("2026-11-28", { subuh: "04:11" })]; // Jumat & Sabtu
  const pagi = sholatBerikutnya(hari, epochWIB("2026-11-27", "09:00"));
  assert.equal(pagi?.kunci, "dzuhur");
  assert.equal(pagi?.label, "Jumat");
  assert.equal(pagi?.epochSebelumnya, epochWIB("2026-11-27", "04:10"));

  const malam = sholatBerikutnya(hari, epochWIB("2026-11-27", "20:00"));
  assert.equal(malam?.kunci, "subuh");
  assert.equal(malam?.jam, "04:11");
  assert.equal(malam?.epoch, epochWIB("2026-11-28", "04:11"));

  // Sebelum Subuh: kemajuan dihitung dari perkiraan Isya kemarin.
  const dini = sholatBerikutnya(hari, epochWIB("2026-11-27", "02:00"));
  assert.equal(dini?.kunci, "subuh");
  assert.equal(dini?.epochSebelumnya, epochWIB("2026-11-26", "19:08"));

  // Halaman cache sudah usang (jadwal hari ini tidak ada).
  assert.equal(sholatBerikutnya(hari, epochWIB("2026-11-30", "09:00")), null);
  assert.equal(jadwalUntuk(hari, epochWIB("2026-11-30", "09:00")).usang, true);
  assert.equal(jadwalUntuk(hari, null).usang, false);

  assert.equal(formatDurasi(3_723_000), "01:02:03");
  assert.equal(formatDurasi(-5), "00:00:00");
});
