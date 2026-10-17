"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MAKS_TRANSAKSI_KAS } from "@/lib/batas";
import type { HasilAksi } from "@/lib/hasil-aksi";
import { setelanKasSchema, transaksiKasInput } from "@/lib/schemas";
import { tanggalWIB } from "@/lib/time";
import { hasilValidasiGagal, jalankanAksiAdmin, segarkanHalamanPublik } from "@/server/auth/penjaga";
import { simpanKonten, ubahKonten } from "@/server/store";

/** Kas masjid: transaksi pemasukan/pengeluaran dan pengaturan laporan. */

const idSchema = z.uuid();

function teksForm(formData: FormData, nama: string): string {
  const v = formData.get(nama);
  return typeof v === "string" ? v : "";
}

export async function simpanTransaksiKas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const idMentah = teksForm(formData, "id");
    const id = idMentah ? idSchema.safeParse(idMentah) : null;
    if (id && !id.success) return { ok: false, pesan: "ID transaksi tidak valid." };

    const masukan = transaksiKasInput.safeParse({
      tanggal: teksForm(formData, "tanggal"),
      jenis: teksForm(formData, "jenis"),
      keterangan: teksForm(formData, "keterangan"),
      jumlah: teksForm(formData, "jumlah"),
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    if (masukan.data.tanggal > tanggalWIB()) {
      return { ok: false, pesan: "Tanggal transaksi tidak boleh di masa depan.", galat: { tanggal: ["Tanggal belum terjadi"] } };
    }

    let hasil: HasilAksi = { ok: true, pesan: id ? "Perubahan transaksi disimpan." : "Transaksi dicatat." };
    await ubahKonten("kas", (lama) => {
      if (id) {
        if (!lama.some((x) => x.id === id.data)) {
          hasil = { ok: false, pesan: "Transaksi tidak ditemukan (mungkin sudah dihapus)." };
          return lama;
        }
        return lama.map((x) => (x.id === id.data ? { id: x.id, ...masukan.data } : x));
      }
      if (lama.length >= MAKS_TRANSAKSI_KAS) {
        hasil = { ok: false, pesan: `Catatan kas sudah mencapai batas ${MAKS_TRANSAKSI_KAS} transaksi.` };
        return lama;
      }
      return [...lama, { id: randomUUID(), ...masukan.data }];
    });
    if (hasil.ok) segarkanHalamanPublik();
    return hasil;
  });
}

export async function hapusTransaksiKas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, pesan: "Permintaan tidak valid." };
    let terhapus = false;
    await ubahKonten("kas", (lama) => {
      const baru = lama.filter((x) => x.id !== id.data);
      terhapus = baru.length < lama.length;
      return baru;
    });
    if (!terhapus) return { ok: false, pesan: "Transaksi tidak ditemukan (mungkin sudah dihapus)." };
    segarkanHalamanPublik();
    return { ok: true, pesan: "Transaksi dihapus." };
  });
}

export async function simpanSetelanKas(_sebelumnya: HasilAksi, formData: FormData): Promise<HasilAksi> {
  return jalankanAksiAdmin(async () => {
    const masukan = setelanKasSchema.safeParse({
      saldoAwal: teksForm(formData, "saldoAwal") || "0",
      periodeBulan: teksForm(formData, "periodeBulan"),
      tampilWebsite: formData.get("tampilWebsite") === "on",
      tampilTv: formData.get("tampilTv") === "on",
    });
    if (!masukan.success) return hasilValidasiGagal(masukan.error);
    await simpanKonten("setelanKas", masukan.data);
    segarkanHalamanPublik();
    return { ok: true, pesan: "Pengaturan laporan kas disimpan." };
  });
}
