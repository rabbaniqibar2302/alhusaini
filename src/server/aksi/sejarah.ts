"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import {
  MAKS_FOTO_SEJARAH,
  keteranganFotoSchema,
  narasiSejarahSchema,
  type FotoSejarah,
} from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { bacaKonten, ubahKonten } from "@/server/store";
import { hapusFoto, prosesDanUnggahFoto } from "@/server/unggah-foto";

/** Sejarah masjid: narasi beberapa paragraf dan foto (bebas ditambah, dengan keterangan opsional). */

const idSchema = z.uuid();

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

const FOTO_TIDAK_DITEMUKAN: HasilAksi = { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };

export async function simpanNarasiSejarah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = z.object({ narasi: narasiSejarahSchema }).safeParse({ narasi: teksForm(formData, "narasi") });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    await ubahKonten("sejarah", (lama) => ({ ...lama, narasi: masukan.data.narasi }));
    segarkanHalamanPublik();
    return {
      ok: true,
      pesan: masukan.data.narasi ? "Narasi sejarah disimpan." : "Narasi sejarah dikosongkan.",
    };
  });
}

export async function tambahFotoSejarah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const keterangan = z.object({ keterangan: keteranganFotoSchema }).safeParse({
      keterangan: teksForm(formData, "keterangan"),
    });
    if (!keterangan.success) return hasilValidasiGagal(keterangan.error);
    if ((await bacaKonten("sejarah")).foto.length >= MAKS_FOTO_SEJARAH) {
      return { ok: false, pesan: `Maksimal ${MAKS_FOTO_SEJARAH} foto sejarah.` };
    }

    const foto: FotoSejarah = {
      id: randomUUID(),
      ...(await prosesDanUnggahFoto(formData.get("foto"), "sejarah")),
      keterangan: keterangan.data.keterangan,
    };
    let ditambahkan = false;
    try {
      await ubahKonten("sejarah", (lama) => {
        if (lama.foto.length >= MAKS_FOTO_SEJARAH) return lama;
        ditambahkan = true;
        return { ...lama, foto: [...lama.foto, foto] };
      });
    } catch (err) {
      await hapusFoto(foto);
      throw err;
    }
    if (!ditambahkan) {
      await hapusFoto(foto);
      return { ok: false, pesan: `Maksimal ${MAKS_FOTO_SEJARAH} foto sejarah.` };
    }
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto ditambahkan." };
  });
}

export async function ubahKeteranganFotoSejarah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const fotoId = idSchema.safeParse(formData.get("fotoId"));
    if (!fotoId.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const masukan = z.object({ keterangan: keteranganFotoSchema }).safeParse({
      keterangan: teksForm(formData, "keterangan"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    let ditemukan = false;
    await ubahKonten("sejarah", (lama) => ({
      ...lama,
      foto: lama.foto.map((f) => {
        if (f.id !== fotoId.data) return f;
        ditemukan = true;
        return { ...f, keterangan: masukan.data.keterangan };
      }),
    }));
    if (!ditemukan) return FOTO_TIDAK_DITEMUKAN;
    segarkanHalamanPublik();
    return { ok: true, pesan: "Keterangan foto disimpan." };
  });
}

/** Memindah urutan foto satu langkah ke kiri (-1) atau ke kanan (1). */
export async function pindahFotoSejarah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = z
      .object({ fotoId: idSchema, arah: z.enum(["-1", "1"]) })
      .safeParse({ fotoId: formData.get("fotoId"), arah: formData.get("arah") });
    if (!masukan.success) return { ok: false, pesan: "Permintaan tidak valid." };

    let ditemukan = false;
    await ubahKonten("sejarah", (lama) => {
      const i = lama.foto.findIndex((f) => f.id === masukan.data.fotoId);
      if (i < 0) return lama;
      ditemukan = true;
      const j = i + Number(masukan.data.arah);
      if (j < 0 || j >= lama.foto.length) return lama;
      const foto = [...lama.foto];
      [foto[i], foto[j]] = [foto[j], foto[i]];
      return { ...lama, foto };
    });
    if (!ditemukan) return FOTO_TIDAK_DITEMUKAN;
    segarkanHalamanPublik();
    return { ok: true, pesan: "Urutan foto diubah." };
  });
}

export async function hapusFotoSejarah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const fotoId = idSchema.safeParse(formData.get("fotoId"));
    if (!fotoId.success) return { ok: false, pesan: "Permintaan tidak valid." };

    const terhapus: { foto: FotoSejarah | null } = { foto: null };
    await ubahKonten("sejarah", (lama) => ({
      ...lama,
      foto: lama.foto.filter((f) => {
        if (f.id !== fotoId.data) return true;
        terhapus.foto = f;
        return false;
      }),
    }));
    if (!terhapus.foto) return FOTO_TIDAK_DITEMUKAN;
    await hapusFoto(terhapus.foto);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto dihapus." };
  });
}
