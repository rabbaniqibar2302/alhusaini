"use server";

import { z } from "zod";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { namaPenceramahSchema, type Foto } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { pasangFotoPenceramah, unggahFotoPenceramah } from "@/server/penceramah";
import { ubahKonten } from "@/server/store";
import { hapusFoto } from "@/server/unggah-foto";

const idSchema = z.uuid();

export async function simpanFotoPenceramah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const nama = z.object({ nama: namaPenceramahSchema }).safeParse({ nama: formData.get("nama") ?? "" });
    if (!nama.success) return hasilValidasiGagal(nama.error);
    const foto = await unggahFotoPenceramah(formData.get("foto"));
    await pasangFotoPenceramah(nama.data.nama, foto, formData.get("latarDihapus") === "1");
    segarkanHalamanPublik();
    return { ok: true, pesan: `Foto ${nama.data.nama} disimpan.` };
  });
}

export async function hapusFotoPenceramah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const terhapus: { foto: Foto | null } = { foto: null };
    await ubahKonten("penceramah", (daftar) =>
      daftar.filter((p) => {
        if (p.id !== id.data) return true;
        terhapus.foto = p.foto;
        return false;
      }),
    );
    if (!terhapus.foto) return { ok: false, pesan: "Foto tidak ditemukan (mungkin sudah dihapus)." };
    await hapusFoto(terhapus.foto);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Foto penceramah dihapus." };
  });
}
