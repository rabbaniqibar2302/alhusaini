"use client";

import type { Kontak } from "@/lib/schemas";
import { simpanKontak } from "@/server/aksi/kontak";
import { Bidang, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

export function FormKontak({ kontak }: { kontak: Kontak }) {
  const form = useFormAksi(simpanKontak, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang
          label="Telepon"
          name="telepon"
          type="tel"
          inputMode="tel"
          defaultValue={kontak.telepon}
          maxLength={20}
          placeholder="021-1234567"
          galat={galat.telepon}
        />
        <Bidang
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          defaultValue={kontak.whatsapp}
          maxLength={20}
          placeholder="0812xxxxxxx"
          petunjuk="Juga dipakai untuk tombol layanan ambulans."
          galat={galat.whatsapp}
        />
        <Bidang
          label="Email"
          name="email"
          type="email"
          defaultValue={kontak.email}
          maxLength={100}
          placeholder="dkm@contoh.id"
          galat={galat.email}
        />
        <Bidang
          label="Instagram"
          name="instagram"
          defaultValue={kontak.instagram}
          maxLength={31}
          placeholder="@namaakun"
          autoCapitalize="none"
          galat={galat.instagram}
        />
      </div>
      <p className="text-xs text-stone-500">Kosongkan field yang tidak ingin ditampilkan.</p>
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>Simpan kontak</TombolKirim>
    </form>
  );
}
