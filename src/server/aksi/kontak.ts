"use server";

import type { HasilAksi } from "@/lib/hasil-aksi";
import { kontakSchema } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { simpanKonten } from "@/server/store";

export async function simpanKontak(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const ambil = (nama: string) => {
      const v = formData.get(nama);
      return typeof v === "string" ? v : "";
    };
    const masukan = kontakSchema.safeParse({
      telepon: ambil("telepon"),
      whatsapp: ambil("whatsapp"),
      email: ambil("email").trim(),
      instagram: ambil("instagram"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    await simpanKonten("kontak", masukan.data);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Informasi kontak disimpan." };
  });
}
