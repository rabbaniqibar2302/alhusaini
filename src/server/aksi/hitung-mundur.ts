"use server";

import { z } from "zod";
import { ACARA, BATAS_SELISIH_PENETAPAN, penetapanMasukAkal, tanggalPerkiraan } from "@/lib/countdown";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { keHijriah } from "@/lib/hijri";
import { KUNCI_ACARA, MAKS_PENETAPAN, penetapanSchema } from "@/lib/schemas";
import { formatTanggal, tanggalWIB } from "@/lib/time";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { ubahKonten } from "@/server/store";

const formPenetapan = penetapanSchema.extend({
  tahunHijriah: z.coerce.number({ error: "Tahun Hijriah tidak valid" }).int().min(1440).max(1600),
});

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

export async function simpanPenetapan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = formPenetapan.safeParse({
      acara: teksForm(formData, "acara"),
      tahunHijriah: teksForm(formData, "tahunHijriah"),
      tanggal: teksForm(formData, "tanggal"),
      catatan: teksForm(formData, "catatan"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    const p = masukan.data;

    if (!penetapanMasukAkal(p.acara, p.tahunHijriah, p.tanggal)) {
      const perkiraan = tanggalPerkiraan(p.acara, p.tahunHijriah);
      return {
        ok: false,
        pesan: `Tanggal terlalu jauh dari perkiraan ${ACARA[p.acara].label} ${p.tahunHijriah} H (${formatTanggal(perkiraan)}). Maksimal selisih ${BATAS_SELISIH_PENETAPAN} hari — periksa kembali tahun Hijriah yang dipilih.`,
        galat: { tanggal: ["Tanggal tidak sesuai tahun Hijriah yang dipilih"] },
      };
    }

    await ubahKonten("countdown", (lama) => {
      const tahunSekarang = keHijriah(tanggalWIB(), lama.koreksiHijriah).tahun;
      const lainnya = lama.penetapan.filter(
        (x) =>
          !(x.acara === p.acara && x.tahunHijriah === p.tahunHijriah) &&
          // penetapan untuk tahun yang sudah jauh lewat tidak diperlukan lagi
          x.tahunHijriah >= tahunSekarang - 1,
      );
      return { ...lama, penetapan: [...lainnya, p].slice(-MAKS_PENETAPAN) };
    });
    segarkanHalamanPublik();
    return {
      ok: true,
      pesan: `${ACARA[p.acara].label} ${p.tahunHijriah} H ditetapkan ${formatTanggal(p.tanggal, { hari: true })}.`,
    };
  });
}

export async function hapusPenetapan(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = z
      .object({ acara: z.enum(KUNCI_ACARA), tahunHijriah: z.coerce.number().int().min(1440).max(1600) })
      .safeParse({ acara: formData.get("acara"), tahunHijriah: formData.get("tahunHijriah") });
    if (!masukan.success) return { ok: false, pesan: "Permintaan tidak valid." };
    const { acara, tahunHijriah } = masukan.data;

    await ubahKonten("countdown", (lama) => ({
      ...lama,
      penetapan: lama.penetapan.filter((x) => !(x.acara === acara && x.tahunHijriah === tahunHijriah)),
    }));
    segarkanHalamanPublik();
    return { ok: true, pesan: `Penetapan ${ACARA[acara].label} ${tahunHijriah} H dihapus; kembali ke tanggal otomatis.` };
  });
}

export async function simpanKoreksiHijriah(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const koreksi = z.coerce
      .number()
      .int()
      .min(-2, "Koreksi minimal -2 hari")
      .max(2, "Koreksi maksimal +2 hari")
      .safeParse(formData.get("koreksiHijriah"));
    if (!koreksi.success) return { ok: false, pesan: "Koreksi harus berupa angka bulat antara -2 dan +2." };

    await ubahKonten("countdown", (lama) => ({ ...lama, koreksiHijriah: koreksi.data }));
    segarkanHalamanPublik();
    return { ok: true, pesan: "Koreksi kalender Hijriah disimpan." };
  });
}
