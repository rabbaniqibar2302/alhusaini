"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { JENIS_JADWAL, MAKS_JADWAL, inputJadwal, type JenisJadwal } from "@/lib/schemas";
import { HARI_PEKAN, tanggalWIB } from "@/lib/time";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { ubahKonten } from "@/server/store";

const jenisSchema = z.enum(JENIS_JADWAL);
const idSchema = z.uuid();

const FIELD_KAJIAN = ["pola", "tanggal", "hari", "jam", "ustadz", "materi"] as const;

const FIELD_JADWAL: Record<JenisJadwal, readonly string[]> = {
  khotib: ["tanggal", "khotib", "imam", "tema"],
  pengajianRabu: FIELD_KAJIAN,
  kuliahSubuh: FIELD_KAJIAN,
  pengajianIbu: FIELD_KAJIAN,
};

type ItemJadwal = { id: string; tanggal?: string; hari?: string; jam?: string };

function urutkan(daftar: ItemJadwal[]): ItemJadwal[] {
  const urutanHari = (h?: string) => HARI_PEKAN.indexOf((h ?? "") as (typeof HARI_PEKAN)[number]);
  return [...daftar].sort(
    (a, b) =>
      (a.tanggal ?? "").localeCompare(b.tanggal ?? "") ||
      urutanHari(a.hari) - urutanHari(b.hari) ||
      (a.jam ?? "").localeCompare(b.jam ?? ""),
  );
}

/** Store memvalidasi ulang nilai akhir dengan skema jenis jadwal terkait. */
async function ubahDaftar(jenis: JenisJadwal, ubah: (lama: ItemJadwal[]) => ItemJadwal[]) {
  await ubahKonten(jenis, (lama) => urutkan(ubah(lama as ItemJadwal[])) as typeof lama);
}

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

export async function simpanJadwal(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisSchema.safeParse(formData.get("jenis"));
    if (!jenis.success) return { ok: false, pesan: "Jenis jadwal tidak dikenal." };

    const idMentah = teksForm(formData, "id");
    const id = idMentah ? idSchema.safeParse(idMentah) : null;
    if (id && !id.success) return { ok: false, pesan: "ID jadwal tidak valid." };

    const masukan = inputJadwal[jenis.data].safeParse(
      Object.fromEntries(FIELD_JADWAL[jenis.data].map((f) => [f, teksForm(formData, f)])),
    );
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    let hasil: HasilAksi = { ok: true, pesan: id ? "Perubahan jadwal disimpan." : "Jadwal ditambahkan." };
    await ubahDaftar(jenis.data, (lama) => {
      if (id) {
        const i = lama.findIndex((x) => x.id === id.data);
        if (i < 0) {
          hasil = { ok: false, pesan: "Jadwal tidak ditemukan (mungkin sudah dihapus)." };
          return lama;
        }
        // Item yang sudah diedit admin bukan lagi data contoh.
        return lama.map((x, j) => (j === i ? { ...masukan.data, id: id.data } : x));
      }
      if (lama.length >= MAKS_JADWAL) {
        hasil = { ok: false, pesan: `Maksimal ${MAKS_JADWAL} jadwal. Hapus jadwal lama terlebih dahulu.` };
        return lama;
      }
      return [...lama, { ...masukan.data, id: randomUUID() }];
    });

    if (hasil.ok) segarkanHalamanPublik();
    return hasil;
  });
}

export async function hapusJadwal(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisSchema.safeParse(formData.get("jenis"));
    const id = idSchema.safeParse(formData.get("id"));
    if (!jenis.success || !id.success) return { ok: false, pesan: "Permintaan tidak valid." };

    let terhapus = false;
    await ubahDaftar(jenis.data, (lama) => {
      const baru = lama.filter((x) => x.id !== id.data);
      terhapus = baru.length < lama.length;
      return baru;
    });
    if (!terhapus) return { ok: false, pesan: "Jadwal tidak ditemukan (mungkin sudah dihapus)." };
    segarkanHalamanPublik();
    return { ok: true, pesan: "Jadwal dihapus." };
  });
}

/** Membersihkan jadwal bertanggal yang sudah lewat (jadwal rutin mingguan tidak tersentuh). */
export async function hapusJadwalLewat(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisSchema.safeParse(formData.get("jenis"));
    if (!jenis.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const hariIni = tanggalWIB();
    let jumlah = 0;
    await ubahDaftar(jenis.data, (lama) => {
      const baru = lama.filter((x) => !x.tanggal || x.tanggal >= hariIni);
      jumlah = lama.length - baru.length;
      return baru;
    });
    if (jumlah > 0) segarkanHalamanPublik();
    return { ok: true, pesan: jumlah > 0 ? `${jumlah} jadwal lama dihapus.` : "Tidak ada jadwal yang sudah lewat." };
  });
}
