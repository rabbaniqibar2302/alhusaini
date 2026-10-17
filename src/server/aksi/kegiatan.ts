"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { MAKS_FOTO_KEGIATAN, MAKS_KEGIATAN, kegiatanInput, type FotoBerId, type KegiatanItem } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { bacaKonten, ubahKonten } from "@/server/store";
import { hapusFoto, prosesDanUnggahFoto } from "@/server/unggah-foto";

/**
 * Kegiatan masjid: judul, tanggal, keterangan, dan beberapa foto. Foto
 * diunggah satu per satu (batas ukuran request Vercel 4,5 MB); browser
 * mengirimnya berurutan. Semua aksi melewati jalankanAksiAdmin (cek Origin +
 * sesi admin di server).
 */

const idSchema = z.uuid();

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

/** Terbaru di atas. Urutan stabil: kegiatan baru dengan tanggal yang sama tetap paling depan. */
function urutkan(daftar: KegiatanItem[]): KegiatanItem[] {
  return [...daftar].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

const TIDAK_DITEMUKAN: HasilAksi = { ok: false, pesan: "Kegiatan tidak ditemukan (mungkin sudah dihapus)." };

export async function simpanKegiatan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const idMentah = teksForm(formData, "id");
    const id = idMentah ? idSchema.safeParse(idMentah) : null;
    if (id && !id.success) return { ok: false, pesan: "ID kegiatan tidak valid." };

    const masukan = kegiatanInput.safeParse({
      judul: teksForm(formData, "judul"),
      tanggal: teksForm(formData, "tanggal"),
      keterangan: teksForm(formData, "keterangan"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    const idBaru = randomUUID();
    let hasil: HasilAksi = id
      ? { ok: true, pesan: "Perubahan kegiatan disimpan." }
      : { ok: true, pesan: "Kegiatan ditambahkan.", idBaru };
    await ubahKonten("kegiatan", (lama) => {
      if (id) {
        const ada = lama.some((x) => x.id === id.data);
        if (!ada) {
          hasil = TIDAK_DITEMUKAN;
          return lama;
        }
        return urutkan(lama.map((x) => (x.id === id.data ? { id: x.id, ...masukan.data, foto: x.foto } : x)));
      }
      if (lama.length >= MAKS_KEGIATAN) {
        hasil = { ok: false, pesan: `Maksimal ${MAKS_KEGIATAN} kegiatan. Hapus kegiatan lama terlebih dahulu.` };
        return lama;
      }
      return urutkan([{ id: idBaru, ...masukan.data, foto: [] }, ...lama]);
    });

    if (hasil.ok) segarkanHalamanPublik();
    return hasil;
  });
}

export async function hapusKegiatan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

    const terhapus: { item: KegiatanItem | null } = { item: null };
    await ubahKonten("kegiatan", (lama) =>
      lama.filter((x) => {
        if (x.id !== id.data) return true;
        terhapus.item = x;
        return false;
      }),
    );
    if (!terhapus.item) return TIDAK_DITEMUKAN;
    await Promise.all(terhapus.item.foto.map((f) => hapusFoto(f)));
    segarkanHalamanPublik();
    return { ok: true, pesan: "Kegiatan beserta fotonya dihapus." };
  });
}

export async function tambahFotoKegiatan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };

    // Cek dulu supaya tidak ada foto yang terunggah sia-sia.
    const kegiatan = (await bacaKonten("kegiatan")).find((x) => x.id === id.data);
    if (!kegiatan) return TIDAK_DITEMUKAN;
    if (kegiatan.foto.length >= MAKS_FOTO_KEGIATAN) {
      return { ok: false, pesan: `Maksimal ${MAKS_FOTO_KEGIATAN} foto per kegiatan.` };
    }

    const foto: FotoBerId = { id: randomUUID(), ...(await prosesDanUnggahFoto(formData.get("foto"), "kegiatan")) };
    let ditambahkan = false;
    try {
      await ubahKonten("kegiatan", (lama) =>
        lama.map((x) => {
          if (x.id !== id.data || x.foto.length >= MAKS_FOTO_KEGIATAN) return x;
          ditambahkan = true;
          return { ...x, foto: [...x.foto, foto] };
        }),
      );
    } catch (err) {
      await hapusFoto(foto);
      throw err;
    }
    if (!ditambahkan) {
      await hapusFoto(foto);
      return { ok: false, pesan: "Foto tidak dapat ditambahkan: kegiatan sudah dihapus atau jumlah foto sudah penuh." };
    }
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto ditambahkan." };
  });
}

const fotoKegiatanSchema = z.object({ id: idSchema, fotoId: idSchema });

export async function hapusFotoKegiatan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = fotoKegiatanSchema.safeParse({ id: formData.get("id"), fotoId: formData.get("fotoId") });
    if (!masukan.success) return { ok: false, pesan: "Permintaan tidak valid." };

    const terhapus: { foto: FotoBerId | null } = { foto: null };
    await ubahKonten("kegiatan", (lama) =>
      lama.map((x) => {
        if (x.id !== masukan.data.id) return x;
        return {
          ...x,
          foto: x.foto.filter((f) => {
            if (f.id !== masukan.data.fotoId) return true;
            terhapus.foto = f;
            return false;
          }),
        };
      }),
    );
    if (!terhapus.foto) return { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };
    await hapusFoto(terhapus.foto);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto dihapus." };
  });
}

/** Menjadikan foto sebagai foto utama (sampul) kegiatan. */
export async function jadikanSampulKegiatan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = fotoKegiatanSchema.safeParse({ id: formData.get("id"), fotoId: formData.get("fotoId") });
    if (!masukan.success) return { ok: false, pesan: "Permintaan tidak valid." };

    let ditemukan = false;
    await ubahKonten("kegiatan", (lama) =>
      lama.map((x) => {
        const foto = x.id === masukan.data.id ? x.foto.find((f) => f.id === masukan.data.fotoId) : undefined;
        if (!foto) return x;
        ditemukan = true;
        return { ...x, foto: [foto, ...x.foto.filter((f) => f.id !== foto.id)] };
      }),
    );
    if (!ditemukan) return { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto utama kegiatan diganti." };
  });
}
