"use server";

import { z } from "zod";
import { JENIS_ADZAN } from "@/lib/audio";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { type AudioAdzan, urlAudioSchema } from "@/lib/schemas";
import { hapusAudio, periksaAudioTerunggah } from "@/server/audio-adzan";
import { jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { ubahKonten } from "@/server/store";

const jenisSchema = z.enum(JENIS_ADZAN);

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

/** Nama file asli untuk ditampilkan; karakter kontrol dibuang. */
function rapikanNama(nama: string): string {
  const bersih = nama.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 120);
  return bersih || "adzan";
}

/** Mendaftarkan file adzan yang baru diunggah browser ke Vercel Blob. */
export async function simpanAudioAdzan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisSchema.safeParse(formData.get("jenis"));
    const url = urlAudioSchema.safeParse(teksForm(formData, "url"));
    if (!jenis.success || !url.success) return { ok: false, pesan: "Data file audio tidak valid." };

    let info: Awaited<ReturnType<typeof periksaAudioTerunggah>>;
    try {
      info = await periksaAudioTerunggah(url.data);
    } catch (err) {
      // File yang tidak lolos pemeriksaan langsung dihapus dari Blob.
      await hapusAudio({ url: url.data });
      throw err;
    }

    const audio: AudioAdzan = {
      url: url.data,
      pathname: new URL(url.data).pathname.slice(1),
      ukuran: info.ukuran,
      nama: rapikanNama(teksForm(formData, "nama")),
    };
    const lama: { audio: AudioAdzan | null } = { audio: null };
    try {
      await ubahKonten("adzan", (sekarang) => {
        lama.audio = sekarang[jenis.data];
        return { ...sekarang, [jenis.data]: audio };
      });
    } catch (err) {
      await hapusAudio(audio);
      throw err;
    }
    if (lama.audio?.url !== audio.url) await hapusAudio(lama.audio);
    segarkanHalamanPublik();
    return {
      ok: true,
      pesan: jenis.data === "subuh" ? "Suara adzan Subuh disimpan." : "Suara adzan disimpan.",
    };
  });
}

export async function hapusAudioAdzan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const jenis = jenisSchema.safeParse(formData.get("jenis"));
    if (!jenis.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const lama: { audio: AudioAdzan | null } = { audio: null };
    await ubahKonten("adzan", (sekarang) => {
      lama.audio = sekarang[jenis.data];
      return { ...sekarang, [jenis.data]: null };
    });
    if (!lama.audio) return { ok: false, pesan: "File adzan tidak ditemukan (mungkin sudah dihapus)." };
    await hapusAudio(lama.audio);
    segarkanHalamanPublik();
    return { ok: true, pesan: "File adzan dihapus." };
  });
}
