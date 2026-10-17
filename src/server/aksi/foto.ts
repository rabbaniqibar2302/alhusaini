"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import {
  JENIS_LEGALITAS,
  MAKS_GALERI,
  keteranganGaleriSchema,
  nomorRegistrasiSchema,
  tanggalGaleriSchema,
  type Foto,
} from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { bacaKonten, simpanKonten, ubahKonten } from "@/server/store";
import { hapusFoto, prosesDanUnggahFoto } from "@/server/unggah-foto";

/**
 * Upload foto hanya lewat aksi-aksi di bawah ini. Semuanya melewati
 * jalankanAksiAdmin (cek Origin + sesi admin di server) dan prosesDanUnggahFoto
 * (batas 5 MB, magic bytes, decode ulang, nama file acak).
 */

const idSchema = z.uuid();
const jenisLegalitasSchema = z.enum(JENIS_LEGALITAS);

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

function adaFile(formData: FormData, nama: string): boolean {
  const f = formData.get(nama);
  return f instanceof File && f.size > 0;
}

/** Simpan data; bila gagal, foto yang baru diunggah dihapus lagi agar tidak jadi sampah. */
async function simpanAtauBersihkan(fotoBaru: Foto, simpan: () => Promise<void>) {
  try {
    await simpan();
  } catch (err) {
    await hapusFoto(fotoBaru);
    throw err;
  }
}

/* ----------------------------- Foto masjid ----------------------------- */

export async function unggahFotoMasjid(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = await bacaKonten("hero");
    const baru = await prosesDanUnggahFoto(formData.get("foto"), "hero");
    await simpanAtauBersihkan(baru, () => simpanKonten("hero", baru));
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto masjid diperbarui." };
  });
}

export async function hapusFotoMasjid(_sebelumnya: HasilAksi): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = await bacaKonten("hero");
    await simpanKonten("hero", null);
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto masjid dihapus; halaman depan memakai ilustrasi bawaan." };
  });
}

/* --------------------------------- Logo --------------------------------- */

export async function unggahLogo(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = await bacaKonten("logo");
    const baru = await prosesDanUnggahFoto(formData.get("foto"), "logo", { sisiMaks: 600, logo: true });
    await simpanAtauBersihkan(baru, () => simpanKonten("logo", baru));
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Logo masjid diperbarui." };
  });
}

export async function hapusLogo(_sebelumnya: HasilAksi): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = await bacaKonten("logo");
    await simpanKonten("logo", null);
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Logo dihapus; situs memakai ikon masjid bawaan." };
  });
}

/* ------------------------------ Legalitas ------------------------------ */

export async function simpanLegalitas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisLegalitasSchema.safeParse(formData.get("jenis"));
    if (!jenis.success) return { ok: false, pesan: "Jenis dokumen tidak dikenal." };
    const nomor = z.object({ nomor: nomorRegistrasiSchema }).safeParse({ nomor: teksForm(formData, "nomor") });
    if (!nomor.success) return hasilValidasiGagal(nomor.error);

    const lama = await bacaKonten("legalitas");
    const fotoLama = lama[jenis.data].foto;
    const fotoBaru = adaFile(formData, "foto") ? await prosesDanUnggahFoto(formData.get("foto"), "legalitas") : null;

    const simpan = () =>
      simpanKonten("legalitas", {
        ...lama,
        [jenis.data]: { nomor: nomor.data.nomor, foto: fotoBaru ?? fotoLama },
      });
    if (fotoBaru) {
      await simpanAtauBersihkan(fotoBaru, simpan);
      await hapusFoto(fotoLama);
    } else {
      await simpan();
    }
    segarkanHalamanPublik();
    return { ok: true, pesan: fotoBaru ? "Nomor registrasi dan foto bukti disimpan." : "Nomor registrasi disimpan." };
  });
}

export async function hapusFotoLegalitas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisLegalitasSchema.safeParse(formData.get("jenis"));
    if (!jenis.success) return { ok: false, pesan: "Jenis dokumen tidak dikenal." };
    const lama = await bacaKonten("legalitas");
    const fotoLama = lama[jenis.data].foto;
    await simpanKonten("legalitas", { ...lama, [jenis.data]: { ...lama[jenis.data], foto: null } });
    await hapusFoto(fotoLama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto bukti registrasi dihapus." };
  });
}

/* --------------------------- Galeri ambulans --------------------------- */

const teksGaleriSchema = z.object({ keterangan: keteranganGaleriSchema, tanggal: tanggalGaleriSchema });

export async function tambahFotoGaleri(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    // Validasi teks dulu supaya tidak ada foto yang terunggah sia-sia.
    const teks = teksGaleriSchema.safeParse({
      keterangan: teksForm(formData, "keterangan"),
      tanggal: teksForm(formData, "tanggal"),
    });
    if (!teks.success) return hasilValidasiGagal(teks.error);
    const lama = await bacaKonten("galeri");
    if (lama.length >= MAKS_GALERI) {
      return { ok: false, pesan: `Galeri maksimal ${MAKS_GALERI} foto. Hapus foto lama terlebih dahulu.` };
    }

    const foto = await prosesDanUnggahFoto(formData.get("foto"), "galeri");
    await simpanAtauBersihkan(foto, async () => {
      await ubahKonten("galeri", (daftar) => [{ id: randomUUID(), foto, ...teks.data }, ...daftar].slice(0, MAKS_GALERI));
    });
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto kegiatan ambulans ditambahkan." };
  });
}

export async function ubahFotoGaleri(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const teks = teksGaleriSchema.safeParse({
      keterangan: teksForm(formData, "keterangan"),
      tanggal: teksForm(formData, "tanggal"),
    });
    if (!teks.success) return hasilValidasiGagal(teks.error);

    let ditemukan = false;
    await ubahKonten("galeri", (daftar) =>
      daftar.map((item) => {
        if (item.id !== id.data) return item;
        ditemukan = true;
        return { id: item.id, foto: item.foto, ...teks.data };
      }),
    );
    if (!ditemukan) return { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };
    segarkanHalamanPublik();
    return { ok: true, pesan: "Keterangan foto disimpan." };
  });
}

export async function hapusFotoGaleri(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

    const terhapus: { foto: Foto | null } = { foto: null };
    await ubahKonten("galeri", (daftar) =>
      daftar.filter((item) => {
        if (item.id !== id.data) return true;
        terhapus.foto = item.foto;
        return false;
      }),
    );
    if (!terhapus.foto) return { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };
    await hapusFoto(terhapus.foto);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto dihapus dari galeri." };
  });
}
