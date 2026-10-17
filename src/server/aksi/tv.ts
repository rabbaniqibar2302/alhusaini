"use server";

import type { HasilAksi } from "@/lib/hasil-aksi";
import { setelanTvSchema } from "@/lib/schemas";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { simpanKonten } from "@/server/store";

const FIELD = Object.keys(setelanTvSchema.shape) as (keyof typeof setelanTvSchema.shape)[];
// Kotak centang tidak terkirim bila tidak dicentang, jadi dibaca sebagai true/false.
const FIELD_CENTANG = new Set<string>(["adzanSubuh", "adzanDzuhur", "adzanAshar", "adzanMaghrib", "adzanIsya", "adzanJumat"]);

export async function simpanPengaturanTv(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = setelanTvSchema.safeParse(
      Object.fromEntries(
        FIELD.map((f) => {
          const v = formData.get(f);
          return [f, FIELD_CENTANG.has(f) ? v === "on" : typeof v === "string" ? v : ""];
        }),
      ),
    );
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    await simpanKonten("tv", masukan.data);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Pengaturan layar TV disimpan. Layar TV akan menyesuaikan dalam beberapa menit." };
  });
}
