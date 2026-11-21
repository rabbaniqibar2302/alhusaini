import { agendaMendatang } from "./agenda";
import { INFO_KAJIAN, kajianDalamRentang } from "./kajian";
import type { Konten } from "./schemas";
import { INFO_SHOLAT_KHUSUS, labelSholatKhusus, sholatKhususMendatang } from "./sholat-khusus";
import { NAMA_BULAN, namaHari, singkatanHari, tambahHari } from "./time";

/**
 * Isi pita "Segera di masjid" di halaman depan: jadwal terdekat dari semua
 * jenis (sholat Ied/gerhana, agenda, Jumat, kajian), berurutan waktu. Data
 * contoh tidak ikut, sama seperti layar TV.
 */

export type JenisSegera = "sholatKhusus" | "agenda" | "jumat" | "kajian";

export type ItemSegera = {
  kunci: string;
  jenis: JenisSegera;
  tanggal: string;
  /** "HH:MM" atau kosong. */
  jam: string;
  judul: string;
  keterangan: string;
  /** Id bagian halaman depan. */
  bagian: string;
};

const HARI_KAJIAN = 7;
const HARI_JUMAT = 14;
const HARI_AGENDA = 30;
const HARI_SHOLAT_KHUSUS = 30;
const MAKS_ITEM = 10;

export function itemSegera(
  k: Pick<Konten, "sholatKhusus" | "agenda" | "khotib" | "pengajianRabu" | "kuliahSubuh" | "pengajianIbu">,
  hariIni: string,
): ItemSegera[] {
  const batas = (hari: number) => tambahHari(hariIni, hari - 1);
  const hasil: ItemSegera[] = [];

  for (const x of sholatKhususMendatang(k.sholatKhusus.filter((i) => !i.contoh), hariIni)) {
    if (x.tanggal > batas(HARI_SHOLAT_KHUSUS)) continue;
    hasil.push({
      kunci: `sholat-${x.id}`,
      jenis: "sholatKhusus",
      tanggal: x.tanggal,
      jam: x.jam,
      judul: INFO_SHOLAT_KHUSUS[x.jenis].nama,
      keterangan: x.lokasi || `Khotib ${x.khotib}`,
      bagian: "sholat-khusus",
    });
  }

  for (const x of agendaMendatang(k.agenda, hariIni)) {
    if (x.contoh || x.tanggal > batas(HARI_AGENDA)) continue;
    // Agenda beberapa hari yang sedang berlangsung ditampilkan pada hari ini.
    hasil.push({
      kunci: `agenda-${x.id}`,
      jenis: "agenda",
      tanggal: x.tanggal < hariIni ? hariIni : x.tanggal,
      jam: x.jam,
      judul: x.judul,
      keterangan: x.lokasi || "Agenda masjid",
      bagian: "agenda",
    });
  }

  for (const x of k.khotib) {
    if (x.contoh || x.tanggal < hariIni || x.tanggal > batas(HARI_JUMAT)) continue;
    hasil.push({
      kunci: `jumat-${x.id}`,
      jenis: "jumat",
      tanggal: x.tanggal,
      jam: "",
      judul: "Sholat Jumat",
      keterangan: `Khotib ${x.khotib}`,
      bagian: "khotib",
    });
  }

  const kajianAsli = {
    pengajianRabu: k.pengajianRabu.filter((x) => !x.contoh),
    kuliahSubuh: k.kuliahSubuh.filter((x) => !x.contoh),
    pengajianIbu: k.pengajianIbu.filter((x) => !x.contoh),
  };
  for (const x of kajianDalamRentang(kajianAsli, hariIni, HARI_KAJIAN)) {
    hasil.push({
      kunci: `kajian-${x.kunci}`,
      jenis: "kajian",
      tanggal: x.tanggal,
      jam: x.jam,
      judul: INFO_KAJIAN[x.jenis].judul,
      keterangan: x.ustadz,
      bagian: "kajian",
    });
  }

  return hasil
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || (a.jam || "99").localeCompare(b.jam || "99"))
    .slice(0, MAKS_ITEM);
}

/** "Hari ini", "Besok", atau "Rab, 25 Nov"; ditambah jam bila ada. */
export function labelWaktuSegera(x: Pick<ItemSegera, "tanggal" | "jam">, hariIni: string): string {
  const [, bulan, tgl] = x.tanggal.split("-").map(Number);
  const hari =
    x.tanggal === hariIni
      ? "Hari ini"
      : x.tanggal === tambahHari(hariIni, 1)
        ? "Besok"
        : `${singkatanHari(namaHari(x.tanggal))}, ${tgl} ${NAMA_BULAN[bulan - 1].slice(0, 3)}`;
  return x.jam ? `${hari} · ${x.jam}` : hari;
}

/** Sorotan hero: sholat Ied/gerhana terdekat, mis. "Idul Fitri 1448 H · Selasa, 9 Maret". */
export function sorotanSholatKhusus(
  sholatKhusus: Konten["sholatKhusus"],
  hariIni: string,
): { label: string; teks: string; href: string } | null {
  const x = sholatKhususMendatang(sholatKhusus.filter((i) => !i.contoh), hariIni)[0];
  if (!x || x.tanggal > tambahHari(hariIni, HARI_SHOLAT_KHUSUS - 1)) return null;
  const href = "#sholat-khusus";
  if (x.tanggal === hariIni) return { label: "Hari ini", teks: `${labelSholatKhusus(x)} · pukul ${x.jam} WIB`, href };
  const [, bulan, tgl] = x.tanggal.split("-").map(Number);
  return { label: "Segera", teks: `${labelSholatKhusus(x)} · ${namaHari(x.tanggal)}, ${tgl} ${NAMA_BULAN[bulan - 1]}`, href };
}
