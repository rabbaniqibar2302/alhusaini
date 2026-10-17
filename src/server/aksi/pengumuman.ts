"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { pengumumanBerakhir } from "@/lib/pengumuman";
import { MAKS_PENGUMUMAN, pengumumanInput } from "@/lib/schemas";
import { tanggalWIB } from "@/lib/time";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { ubahKonten } from "@/server/store";

/** Pengumuman: selalu tampil sebagai teks berjalan di layar TV, opsional juga di website. */

const idSchema = z.uuid();

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

export async function simpanPengumuman(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const idMentah = teksForm(formData, "id");
    const id = idMentah ? idSchema.safeParse(idMentah) : null;
    if (id && !id.success) return { ok: false, pesan: "ID pengumuman tidak valid." };

    const masukan = pengumumanInput.safeParse({
      teks: teksForm(formData, "teks"),
      mulai: teksForm(formData, "mulai"),
      sampai: teksForm(formData, "sampai"),
      diWebsite: formData.get("diWebsite") === "on",
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    let hasil: HasilAksi = { ok: true, pesan: id ? "Perubahan pengumuman disimpan." : "Pengumuman ditambahkan." };
    await ubahKonten("pengumuman", (lama) => {
      if (id) {
        if (!lama.some((x) => x.id === id.data)) {
          hasil = { ok: false, pesan: "Pengumuman tidak ditemukan (mungkin sudah dihapus)." };
          return lama;
        }
        // Pengumuman yang sudah diedit admin bukan lagi data contoh.
        return lama.map((x) => (x.id === id.data ? { id: x.id, ...masukan.data } : x));
      }
      if (lama.length >= MAKS_PENGUMUMAN) {
        hasil = { ok: false, pesan: `Maksimal ${MAKS_PENGUMUMAN} pengumuman. Hapus pengumuman lama terlebih dahulu.` };
        return lama;
      }
      return [{ id: randomUUID(), ...masukan.data }, ...lama];
    });

    if (hasil.ok) segarkanHalamanPublik();
    return hasil;
  });
}

export async function hapusPengumuman(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
    let terhapus = false;
    await ubahKonten("pengumuman", (lama) => {
      const baru = lama.filter((x) => x.id !== id.data);
      terhapus = baru.length < lama.length;
      return baru;
    });
    if (!terhapus) return { ok: false, pesan: "Pengumuman tidak ditemukan (mungkin sudah dihapus)." };
    segarkanHalamanPublik();
    return { ok: true, pesan: "Pengumuman dihapus." };
  });
}

export async function hapusPengumumanBerakhir(_sebelumnya: HasilAksi): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const hariIni = tanggalWIB();
    let jumlah = 0;
    await ubahKonten("pengumuman", (lama) => {
      const baru = lama.filter((x) => !pengumumanBerakhir(x, hariIni));
      jumlah = lama.length - baru.length;
      return baru;
    });
    if (jumlah > 0) segarkanHalamanPublik();
    return {
      ok: true,
      pesan: jumlah > 0 ? `${jumlah} pengumuman yang sudah berakhir dihapus.` : "Tidak ada pengumuman yang sudah berakhir.",
    };
  });
}
