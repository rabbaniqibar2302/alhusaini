import type { KunciKonten } from "./schemas";

/** Nama kunci Redis per jenis konten (nilai disimpan sebagai JSON). */
export const KUNCI_REDIS: Record<KunciKonten, string> = {
  khotib: "jadwal:khotib",
  pengajianRabu: "jadwal:pengajian-rabu",
  kuliahSubuh: "jadwal:kuliah-subuh",
  pengajianIbu: "jadwal:pengajian-ibu",
  countdown: "setting:countdown",
  kontak: "setting:kontak",
  legalitas: "setting:legalitas",
  hero: "media:hero",
  galeri: "media:galeri-ambulans",
  pengumuman: "konten:pengumuman",
  kegiatan: "konten:kegiatan",
  sejarah: "konten:sejarah",
  logo: "media:logo",
  tv: "setting:tv",
};
