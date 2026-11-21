"use server";

import type { HasilAksi } from "@/lib/hasil-aksi";
import { tampilanInput } from "@/lib/schemas";
import { TEMA } from "@/lib/tema";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { simpanKonten } from "@/server/store";

export async function simpanTampilan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = tampilanInput.safeParse({ tema: formData.get("tema") });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);

    await simpanKonten("tampilan", masukan.data);
    segarkanHalamanPublik();
    return {
      ok: true,
      pesan: `Tema "${TEMA[masukan.data.tema].nama}" diterapkan. Layar TV akan menyesuaikan dalam beberapa menit.`,
    };
  });
}
