import { labelJamKajian, labelWaktuKajian, type JenisKajian, type PolaJadwal } from "@/lib/kajian";
import type { JenisJadwal } from "@/lib/schemas";
import { HARI_PEKAN, formatTanggal, hariKe, tambahHari, tanggalBerikutnya } from "@/lib/time";

export type FieldJadwal = {
  nama: string;
  label: string;
  /** "waktu": pilihan tanggal tertentu / rutin setiap pekan (field pola, tanggal, hari). */
  tipe: "date" | "time" | "text" | "waktu";
  wajib: boolean;
  maks?: number;
  placeholder?: string;
  /** Nama penceramah: diberi saran nama & pilihan foto. */
  penceramah?: boolean;
};

export type ItemJadwalUmum = { id: string; contoh?: boolean } & Record<string, string | boolean | undefined>;

type Konfigurasi = {
  judul: string;
  deskripsi: string;
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

/** Tanggal default untuk kajian yang bisa di hari apa saja: sehari setelah jadwal terakhir, atau besok. */
function hariSetelahTerakhir(daftar: ItemJadwalUmum[], hariIni: string): string {
  const terakhir = daftar.map((x) => teks(x.tanggal)).filter((t) => t >= hariIni).sort().at(-1);
  return tambahHari(terakhir ?? hariIni, 1);
}

export function waktuItem(x: ItemJadwalUmum): { pola: PolaJadwal; tanggal: string; hari: string } {
  return { pola: x.pola === "mingguan" ? "mingguan" : "tanggal", tanggal: teks(x.tanggal), hari: teks(x.hari) };
}

function fieldKajian(jenis: JenisKajian): FieldJadwal[] {
  return [
    { nama: "pola", label: "Waktu pelaksanaan", tipe: "waktu", wajib: true },
    ...(jenis === "kuliahSubuh"
      ? []
      : [{ nama: "jam", label: "Jam mulai (WIB)", tipe: "time" as const, wajib: true }]),
    {
      nama: "ustadz",
      label: "Nama ustadz/ustadzah",
      tipe: "text",
      wajib: true,
      penceramah: true,
      maks: 100,
      placeholder: "Ust. ... / Ustadzah ...",
    },
    { nama: "materi", label: "Materi / kitab", tipe: "text", wajib: true, maks: 150 },
  ];
}

function ringkasanKajian(jenis: JenisKajian) {
  return (x: ItemJadwalUmum) => {
    const jam = labelJamKajian(jenis, { jam: teks(x.jam) });
    return {
      judul: `${labelWaktuKajian(waktuItem(x))}${jam ? ` · ${jam}` : ""}`,
      baris: [
        ["Ustadz/ah", teks(x.ustadz)],
        ["Materi", teks(x.materi)],
      ] as [string, string][],
    };
  };
}

export const KONFIGURASI_JADWAL: Record<JenisJadwal, Konfigurasi> = {
  khotib: {
    judul: "Jadwal Khotib Jumat",
    deskripsi: "Tanggal, nama khotib, imam, dan tema khutbah sholat Jumat.",
    field: [
      { nama: "tanggal", label: "Tanggal (hari Jumat)", tipe: "date", wajib: true },
      { nama: "khotib", label: "Nama khotib", tipe: "text", wajib: true, maks: 100, placeholder: "Ust. ...", penceramah: true },
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
    deskripsi: "Pilih tanggal tertentu atau jadwal rutin setiap pekan, lalu isi jam, pengisi, dan materi.",
    field: fieldKajian("pengajianRabu"),
    ringkasan: ringkasanKajian("pengajianRabu"),
    nilaiAwal: (daftar, hariIni) => ({
      pola: "tanggal",
      tanggal: setelahTerakhir(daftar, hariIni, 3),
      hari: "Rabu",
      jam: "19:30",
    }),
  },
  kuliahSubuh: {
    judul: "Jadwal Kuliah Subuh",
    deskripsi: "Kajian ba'da Subuh. Bisa di hari dan tanggal apa saja, atau rutin setiap pekan.",
    field: fieldKajian("kuliahSubuh"),
    ringkasan: ringkasanKajian("kuliahSubuh"),
    nilaiAwal: (daftar, hariIni) => ({ pola: "tanggal", tanggal: hariSetelahTerakhir(daftar, hariIni), hari: "Ahad" }),
  },
  pengajianIbu: {
    judul: "Jadwal Pengajian Kaum Ibu",
    deskripsi: "Majelis taklim muslimah. Pengisinya bisa ustadzah maupun ustadz.",
    field: fieldKajian("pengajianIbu"),
    ringkasan: ringkasanKajian("pengajianIbu"),
    nilaiAwal: (daftar, hariIni) => ({
      pola: "tanggal",
      tanggal: hariSetelahTerakhir(daftar, hariIni),
      hari: "Selasa",
      jam: "09:00",
    }),
  },
};

export const OPSI_HARI = HARI_PEKAN;

/** Peringatan ringan bila tanggal/hari tidak jatuh pada hari yang lazim. */
export function peringatanHari(
  jenis: JenisJadwal,
  waktu: { pola: PolaJadwal; tanggal: string; hari: string },
): string | null {
  const bertanggal = jenis === "khotib" || waktu.pola === "tanggal";
  if (bertanggal) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(waktu.tanggal)) return null;
    if (jenis === "khotib" && hariKe(waktu.tanggal) !== 5) return "Tanggal ini bukan hari Jumat.";
    if (jenis === "pengajianRabu" && hariKe(waktu.tanggal) !== 3) return "Tanggal ini bukan hari Rabu.";
    return null;
  }
  if (jenis === "pengajianRabu" && waktu.hari && waktu.hari !== "Rabu") return "Hari yang dipilih bukan Rabu.";
  return null;
}
