"use server";

import type { HasilAksi } from "@/lib/hasil-aksi";
import { identitasSchema } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { simpanKonten } from "@/server/store";

export async function simpanIdentitas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const ambil = (nama: string) => {
      const v = formData.get(nama);
      return typeof v === "string" ? v : "";
    };
    const masukan = identitasSchema.safeParse({
      nama: ambil("nama"),
      namaArab: ambil("namaArab"),
      wilayah: ambil("wilayah"),
      alamat: ambil("alamat"),
      alamatSingkat: ambil("alamatSingkat"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    await simpanKonten("identitas", masukan.data);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Identitas masjid disimpan. Layar TV akan menyesuaikan dalam beberapa menit." };
  });
}
