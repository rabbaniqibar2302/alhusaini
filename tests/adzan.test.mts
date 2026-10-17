import assert from "node:assert/strict";
import { test } from "node:test";
import { deteksiFormatAudio, ukuranAudio } from "../src/lib/audio";
import { adzanJatuhTempo, SETELAN_TV_BAWAAN } from "../src/lib/layar-tv";
import { adzanSchema, setelanTvSchema, skemaKonten } from "../src/lib/schemas";
import { epochWIB } from "../src/lib/time";
import type { JadwalHarian } from "../src/lib/tipe-jadwal-sholat";

const bita = (...x: (number | string)[]) =>
  new Uint8Array(x.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));

test("format audio dikenali dari magic bytes, bukan dari nama file", () => {
  assert.equal(deteksiFormatAudio(bita("ID3", 4, 0, 0)), "mp3");
  assert.equal(deteksiFormatAudio(bita(0xff, 0xfb, 0x90, 0x64)), "mp3"); // MPEG-1 Layer III
  assert.equal(deteksiFormatAudio(bita(0xff, 0xf3, 0x84, 0xc4)), "mp3"); // MPEG-2 Layer III
  assert.equal(deteksiFormatAudio(bita(0, 0, 0, 0x20, "ftypM4A ")), "m4a");
  assert.equal(deteksiFormatAudio(bita("OggS", 0, 2)), "ogg");
  assert.equal(deteksiFormatAudio(bita(0xff, 0xf1, 0x50, 0x80)), null); // AAC ADTS, bukan MP3
  assert.equal(deteksiFormatAudio(bita("<html><script>")), null);
  assert.equal(deteksiFormatAudio(bita("RIFF", 0, 0, 0, 0, "WAVE")), null);
  assert.equal(deteksiFormatAudio(new Uint8Array()), null);
});

test("ukuran file audio ditampilkan dalam KB atau MB", () => {
  assert.equal(ukuranAudio(17_002), "17 KB");
  assert.equal(ukuranAudio(200), "1 KB");
  assert.equal(ukuranAudio(5_761_193), "5,5 MB");
});

const jadwal: JadwalHarian = {
  tanggal: "2026-10-17", // Sabtu
  imsak: "04:03",
  subuh: "04:13",
  terbit: "05:29",
  dzuhur: "11:39",
  ashar: "14:46",
  maghrib: "17:47",
  isya: "18:56",
  sumber: "kemenag",
  lokasi: "KOTA JAKARTA",
};
const jumat: JadwalHarian = { ...jadwal, tanggal: "2026-10-23" };

test("adzan diputar tepat saat masuk waktu (maks. 2 menit sesudahnya)", () => {
  const s = SETELAN_TV_BAWAAN;
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "04:12"), jadwal, s), null);
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "04:13"), jadwal, s)?.kunci, "subuh");
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "04:14") + 59_000, jadwal, s)?.kunci, "subuh");
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "04:15"), jadwal, s), null);
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "18:56"), jadwal, s)?.label, "Isya");
  // Terbit & imsak bukan waktu adzan.
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "05:29"), jadwal, s), null);
  // Waktu yang dimatikan admin tidak berbunyi.
  assert.equal(adzanJatuhTempo(epochWIB(jadwal.tanggal, "17:47"), jadwal, { ...s, adzanMaghrib: false }), null);
});

test("Dzuhur hari Jumat memakai pengaturan Jumat (bawaan: tidak berbunyi)", () => {
  const s = SETELAN_TV_BAWAAN;
  const waktu = epochWIB(jumat.tanggal, "11:39");
  assert.equal(adzanJatuhTempo(waktu, jumat, s), null);
  const nyala = adzanJatuhTempo(waktu, jumat, { ...s, adzanJumat: true });
  assert.equal(nyala?.label, "Jumat");
  assert.equal(adzanJatuhTempo(epochWIB(jumat.tanggal, "14:46"), jumat, s)?.kunci, "ashar");
});

test("pengaturan TV lama (sebelum ada suara adzan) tetap valid dengan nilai bawaan", () => {
  const lama = { iqomahSubuh: 12, iqomahDzuhur: 10, iqomahAshar: 8, iqomahMaghrib: 7, iqomahIsya: 10, durasiSholat: 10, durasiJumat: 45, detikSlide: 15 };
  const hasil = skemaKonten.tv.parse(lama);
  assert.equal(hasil.iqomahSubuh, 12);
  assert.equal(hasil.adzanSubuh, true);
  assert.equal(hasil.adzanJumat, false);
  assert.equal(hasil.volumeAdzan, 100);
  // Dari form: kotak centang yang tidak dicentang dikirim sebagai false.
  const dariForm = setelanTvSchema.parse({ ...lama, adzanSubuh: false, adzanJumat: true, volumeAdzan: "60" });
  assert.equal(dariForm.adzanSubuh, false);
  assert.equal(dariForm.adzanJumat, true);
  assert.equal(dariForm.volumeAdzan, 60);
  assert.ok(!setelanTvSchema.safeParse({ ...lama, volumeAdzan: "150" }).success);
});

test("file adzan hanya boleh dari folder audio Vercel Blob", () => {
  const audio = (url: string) => ({ url, pathname: new URL(url).pathname.slice(1), ukuran: 3_000_000, nama: "adzan.mp3" });
  const uuid = "0f1e2d3c-4b5a-4968-8776-655443322110";
  const dasar = "https://abc123.public.blob.vercel-storage.com/masjid/audio";
  assert.ok(adzanSchema.safeParse({ umum: audio(`${dasar}/${uuid}.mp3`), subuh: null }).success);
  assert.ok(adzanSchema.safeParse({ umum: null, subuh: audio(`${dasar}/${uuid}.m4a`) }).success);
  assert.ok(!adzanSchema.safeParse({ umum: audio(`${dasar}/${uuid}.wav`), subuh: null }).success);
  assert.ok(!adzanSchema.safeParse({ umum: audio(`https://evil.example.com/masjid/audio/${uuid}.mp3`), subuh: null }).success);
  assert.ok(!adzanSchema.safeParse({ umum: { ...audio(`${dasar}/${uuid}.mp3`), ukuran: 20_000_000 }, subuh: null }).success);
});
