"use server";

import { randomUUID } from "node:crypto";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { infakTeksSchema } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { bacaKonten, ubahKonten } from "@/server/store";
import { hapusFoto, prosesDanUnggahFoto } from "@/server/unggah-foto";

/** Informasi infak: daftar rekening, gambar QRIS, dan catatan. */

const teksSemua = (formData: FormData, nama: string) =>
  formData.getAll(nama).map((v) => (typeof v === "string" ? v : ""));

export async function simpanInfak(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const bank = teksSemua(formData, "bank");
    const nomor = teksSemua(formData, "nomor");
    const atasNama = teksSemua(formData, "atasNama");
    const idLama = teksSemua(formData, "idRekening");
    // Baris yang seluruhnya kosong diabaikan.
    const rekening = bank
      .map((b, i) => ({ id: idLama[i] || randomUUID(), bank: b, nomor: nomor[i] ?? "", atasNama: atasNama[i] ?? "" }))
      .filter((r) => `${r.bank}${r.nomor}${r.atasNama}`.trim() !== "");

    const masukan = infakTeksSchema.safeParse({
      rekening,
      namaQris: formData.get("namaQris") ?? "",
      catatan: formData.get("catatan") ?? "",
      tampilTv: formData.get("tampilTv") === "on",
    });
    if (!masukan.success) {
      // Galat per baris rekening, mis. "rekening.1.nomor".
      const galat: Record<string, string[]> = {};
      for (const isu of masukan.error.issues) (galat[isu.path.join(".")] ??= []).push(isu.message);
      return { ...hasilValidasiGagal(masukan.error), galat };
    }
    await ubahKonten("infak", (lama) => ({ ...masukan.data, qris: lama.qris }));
    segarkanHalamanPublik();
    return { ok: true, pesan: "Informasi infak disimpan." };
  });
}

export async function unggahQris(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = (await bacaKonten("infak")).qris;
    // Kualitas tinggi supaya kode QR tetap tajam saat dipindai.
    const baru = await prosesDanUnggahFoto(formData.get("qris"), "qris", { sisiMaks: 1600, kualitasTinggi: true });
    try {
      await ubahKonten("infak", (x) => ({ ...x, qris: baru }));
    } catch (err) {
      await hapusFoto(baru);
      throw err;
    }
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Gambar QRIS diperbarui." };
  });
}

export async function hapusQris(_sebelumnya: HasilAksi): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const lama = (await bacaKonten("infak")).qris;
    await ubahKonten("infak", (x) => ({ ...x, qris: null }));
    await hapusFoto(lama);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Gambar QRIS dihapus." };
  });
}
