"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { agendaLewat } from "@/lib/agenda";
import { MAKS_AGENDA } from "@/lib/batas";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { agendaInput, type AgendaItem, type Foto } from "@/lib/schemas";
import { tanggalWIB } from "@/lib/time";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { ubahKonten } from "@/server/store";
import { hapusFoto, prosesDanUnggahFoto } from "@/server/unggah-foto";

/** Agenda/event mendatang dengan poster (opsional). */

const idSchema = z.uuid();

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

function adaFile(formData: FormData, nama: string): boolean {
  const f = formData.get(nama);
  return f instanceof File && f.size > 0;
}

const urutkan = (daftar: AgendaItem[]) => [...daftar].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

export async function simpanAgenda(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const idMentah = teksForm(formData, "id");
    const id = idMentah ? idSchema.safeParse(idMentah) : null;
    if (id && !id.success) return { ok: false, pesan: "ID agenda tidak valid." };

    const masukan = agendaInput.safeParse({
      judul: teksForm(formData, "judul"),
      tanggal: teksForm(formData, "tanggal"),
      tanggalSelesai: teksForm(formData, "tanggalSelesai"),
      jam: teksForm(formData, "jam"),
      lokasi: teksForm(formData, "lokasi"),
      keterangan: teksForm(formData, "keterangan"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    const data = { ...masukan.data, tanggalSelesai: masukan.data.tanggalSelesai === masukan.data.tanggal ? "" : masukan.data.tanggalSelesai };
    const hapusPoster = formData.get("hapusPoster") === "on";

    // Poster divalidasi & diunggah dulu, lalu dihapus lagi bila penyimpanan gagal.
    const posterBaru = adaFile(formData, "poster")
      ? await prosesDanUnggahFoto(formData.get("poster"), "agenda", { sisiMaks: 1600 })
      : null;

    let hasil: HasilAksi = { ok: true, pesan: id ? "Perubahan agenda disimpan." : "Agenda ditambahkan." };
    const posterLama: { foto: Foto | null } = { foto: null };
    try {
      await ubahKonten("agenda", (lama) => {
        if (id) {
          const item = lama.find((x) => x.id === id.data);
          if (!item) {
            hasil = { ok: false, pesan: "Agenda tidak ditemukan (mungkin sudah dihapus)." };
            return lama;
          }
          const poster = posterBaru ?? (hapusPoster ? null : item.poster);
          if (poster !== item.poster) posterLama.foto = item.poster;
          // Agenda yang sudah diedit admin bukan lagi data contoh.
          return urutkan(lama.map((x) => (x.id === id.data ? { id: x.id, ...data, poster } : x)));
        }
        if (lama.length >= MAKS_AGENDA) {
          hasil = { ok: false, pesan: `Maksimal ${MAKS_AGENDA} agenda. Hapus agenda yang sudah lewat terlebih dahulu.` };
          return lama;
        }
        return urutkan([...lama, { id: randomUUID(), ...data, poster: posterBaru }]);
      });
    } catch (err) {
      await hapusFoto(posterBaru);
      throw err;
    }
    if (!hasil.ok) {
      await hapusFoto(posterBaru);
      return hasil;
    }
    await hapusFoto(posterLama.foto);
    segarkanHalamanPublik();
    return hasil;
  });
}

export async function hapusAgenda(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const terhapus: { item: AgendaItem | null } = { item: null };
    await ubahKonten("agenda", (lama) =>
      lama.filter((x) => {
        if (x.id !== id.data) return true;
        terhapus.item = x;
        return false;
      }),
    );
    if (!terhapus.item) return { ok: false, pesan: "Agenda tidak ditemukan (mungkin sudah dihapus)." };
    await hapusFoto(terhapus.item.poster);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Agenda dihapus." };
  });
}

export async function hapusAgendaLewat(_sebelumnya: HasilAksi): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const hariIni = tanggalWIB();
    let lewat: AgendaItem[] = [];
    await ubahKonten("agenda", (lama) => {
      lewat = lama.filter((x) => agendaLewat(x, hariIni));
      return lama.filter((x) => !agendaLewat(x, hariIni));
    });
    await Promise.all(lewat.map((x) => hapusFoto(x.poster)));
    if (lewat.length > 0) segarkanHalamanPublik();
    return { ok: true, pesan: lewat.length > 0 ? `${lewat.length} agenda lama dihapus.` : "Tidak ada agenda yang sudah lewat." };
  });
}
