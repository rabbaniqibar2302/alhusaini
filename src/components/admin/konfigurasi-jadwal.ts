import type { JenisJadwal } from "@/lib/schemas";
import { HARI_PEKAN, formatTanggal, hariKe, tambahHari, tanggalBerikutnya } from "@/lib/time";

export type FieldJadwal = {
  nama: string;
  label: string;
  tipe: "date" | "time" | "text" | "hari";
  wajib: boolean;
  maks?: number;
  placeholder?: string;
  petunjuk?: string;
};

export type ItemJadwalUmum = { id: string; contoh?: boolean } & Record<string, string | boolean | undefined>;

type Konfigurasi = {
  judul: string;
  deskripsi: string;
  bertanggal: boolean;
  field: FieldJadwal[];
  ringkasan: (x: ItemJadwalUmum) => { judul: string; baris: [string, string][] };
  nilaiAwal: (daftar: ItemJadwalUmum[], hariIni: string) => Record<string, string>;
};

const teks = (v: unknown) => (typeof v === "string" ? v : "");

/** Tanggal default: hari ke-`hari` berikutnya setelah jadwal terakhir (atau mulai hari ini). */
function setelahTerakhir(daftar: ItemJadwalUmum[], hariIni: string, hari: number): string {
  const terakhir = daftar.map((x) => teks(x.tanggal)).filter((t) => t >= hariIni).sort().at(-1);
  const mulai = terakhir ? tambahHari(terakhir, 1) : hariIni;
  return tanggalBerikutnya(mulai, hari, 1)[0];
}

export const KONFIGURASI_JADWAL: Record<JenisJadwal, Konfigurasi> = {
  khotib: {
    judul: "Jadwal Khotib Jumat",
    deskripsi: "Tanggal, nama khotib, imam, dan tema khutbah sholat Jumat.",
    bertanggal: true,
    field: [
      { nama: "tanggal", label: "Tanggal (hari Jumat)", tipe: "date", wajib: true },
      { nama: "khotib", label: "Nama khotib", tipe: "text", wajib: true, maks: 100, placeholder: "Ust. ..." },
      { nama: "imam", label: "Nama imam", tipe: "text", wajib: false, maks: 100, placeholder: "Boleh dikosongkan" },
      { nama: "tema", label: "Tema khutbah", tipe: "text", wajib: false, maks: 150, placeholder: "Boleh dikosongkan" },
    ],
    ringkasan: (x) => ({
      judul: formatTanggal(teks(x.tanggal), { hari: true }),
      baris: [
        ["Khotib", teks(x.khotib)],
        ["Imam", teks(x.imam) || "—"],
        ["Tema", teks(x.tema) || "—"],
      ],
    }),
    nilaiAwal: (daftar, hariIni) => ({ tanggal: setelahTerakhir(daftar, hariIni, 5) }),
  },
  pengajianRabu: {
    judul: "Jadwal Pengajian Rabu",
    deskripsi: "Tanggal, jam, ustadz, dan materi pengajian rutin hari Rabu.",
    bertanggal: true,
    field: [
      { nama: "tanggal", label: "Tanggal", tipe: "date", wajib: true },
      { nama: "jam", label: "Jam mulai (WIB)", tipe: "time", wajib: true },
      { nama: "ustadz", label: "Nama ustadz", tipe: "text", wajib: true, maks: 100, placeholder: "Ust. ..." },
      { nama: "materi", label: "Materi / kitab", tipe: "text", wajib: true, maks: 150 },
    ],
    ringkasan: (x) => ({
      judul: `${formatTanggal(teks(x.tanggal), { hari: true })} · ${teks(x.jam)} WIB`,
      baris: [
        ["Ustadz", teks(x.ustadz)],
        ["Materi", teks(x.materi)],
      ],
    }),
    nilaiAwal: (daftar, hariIni) => ({ tanggal: setelahTerakhir(daftar, hariIni, 3), jam: "19:30" }),
  },
  kuliahSubuh: {
    judul: "Jadwal Kuliah Subuh",
    deskripsi: "Kajian ba'da Subuh per hari dalam sepekan.",
    bertanggal: false,
    field: [
      { nama: "hari", label: "Hari", tipe: "hari", wajib: true },
      { nama: "ustadz", label: "Nama ustadz", tipe: "text", wajib: true, maks: 100, placeholder: "Ust. ..." },
      { nama: "materi", label: "Materi / kitab", tipe: "text", wajib: true, maks: 150 },
    ],
    ringkasan: (x) => ({
      judul: `Setiap ${teks(x.hari)}`,
      baris: [
        ["Ustadz", teks(x.ustadz)],
        ["Materi", teks(x.materi)],
      ],
    }),
    nilaiAwal: () => ({ hari: "Ahad" }),
  },
  pengajianIbu: {
    judul: "Jadwal Pengajian Kaum Ibu",
    deskripsi: "Majelis taklim muslimah per hari dalam sepekan.",
    bertanggal: false,
    field: [
      { nama: "hari", label: "Hari", tipe: "hari", wajib: true },
      { nama: "jam", label: "Jam mulai (WIB)", tipe: "time", wajib: true },
      { nama: "ustadzah", label: "Nama ustadzah", tipe: "text", wajib: true, maks: 100, placeholder: "Ustadzah ..." },
      { nama: "materi", label: "Materi / kitab", tipe: "text", wajib: true, maks: 150 },
    ],
    ringkasan: (x) => ({
      judul: `Setiap ${teks(x.hari)} · ${teks(x.jam)} WIB`,
      baris: [
        ["Ustadzah", teks(x.ustadzah)],
        ["Materi", teks(x.materi)],
      ],
    }),
    nilaiAwal: () => ({ hari: "Selasa", jam: "09:00" }),
  },
};

export const OPSI_HARI = HARI_PEKAN;

/** Peringatan ringan bila tanggal tidak jatuh pada hari yang lazim. */
export function peringatanHari(jenis: JenisJadwal, tanggal: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return null;
  if (jenis === "khotib" && hariKe(tanggal) !== 5) return "Tanggal ini bukan hari Jumat.";
  if (jenis === "pengajianRabu" && hariKe(tanggal) !== 3) return "Tanggal ini bukan hari Rabu.";
  return null;
}
