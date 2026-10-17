"use client";

import { useState } from "react";
import { IkonSampah, IkonUnggah } from "@/components/ikon";
import { MAKS_REKENING } from "@/lib/batas";
import type { Infak } from "@/lib/schemas";
import { hapusQris, simpanInfak, unggahQris } from "@/server/aksi/infak";
import { InputFoto } from "./input-foto";
import { Bidang, Centang, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

type Baris = { kunci: number; id: string; bank: string; nomor: string; atasNama: string };

let nomorBaris = 0;
const barisBaru = (r?: Partial<Baris>): Baris => ({ kunci: ++nomorBaris, id: "", bank: "", nomor: "", atasNama: "", ...r });

/** Rekening, nama QRIS, catatan, dan pilihan tampil di TV (disimpan bersamaan). */
export function FormInfak({ infak }: { infak: Infak }) {
  const [baris, setBaris] = useState<Baris[]>(() =>
    infak.rekening.length > 0 ? infak.rekening.map((r) => barisBaru(r)) : [barisBaru()],
  );
  const form = useFormAksi(simpanInfak, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};

  return (
    <form onSubmit={form.onSubmit} className="space-y-5" noValidate>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-hijau-900">Rekening bank</legend>
        {baris.map((b, i) => (
          <div key={b.kunci} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
            <input type="hidden" name="idRekening" value={b.id} />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
              <Bidang
                label="Bank"
                name="bank"
                id={`bank-${b.kunci}`}
                maxLength={40}
                placeholder="mis. BSI, BRI, Mandiri"
                defaultValue={b.bank}
                galat={galat[`rekening.${i}.bank`]}
              />
              <Bidang
                label="Nomor rekening"
                name="nomor"
                id={`nomor-${b.kunci}`}
                inputMode="numeric"
                maxLength={30}
                placeholder="mis. 7123 4567 89"
                defaultValue={b.nomor}
                galat={galat[`rekening.${i}.nomor`]}
              />
            </div>
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <Bidang
                  label="Atas nama"
                  name="atasNama"
                  id={`atasNama-${b.kunci}`}
                  maxLength={80}
                  placeholder="mis. DKM Masjid Al Husaini"
                  defaultValue={b.atasNama}
                  galat={galat[`rekening.${i}.atasNama`]}
                />
              </div>
              <button
                type="button"
                onClick={() => setBaris((d) => (d.length > 1 ? d.filter((x) => x.kunci !== b.kunci) : [barisBaru()]))}
                aria-label="Hapus rekening ini"
                title="Hapus rekening ini"
                className="mb-0.5 rounded-xl p-2.5 text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                <IkonSampah className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {baris.length < MAKS_REKENING && (
          <button
            type="button"
            onClick={() => setBaris((d) => [...d, barisBaru()])}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
          >
            + Tambah rekening
          </button>
        )}
        <p className="text-xs text-stone-500">Kosongkan semua isian rekening bila hanya memakai QRIS.</p>
      </fieldset>

      <Bidang
        label="Nama di QRIS (opsional)"
        name="namaQris"
        maxLength={80}
        placeholder="mis. Masjid Al Husaini"
        defaultValue={infak.namaQris}
        petunjuk="Ditulis di bawah judul QRIS, supaya jamaah yakin tujuannya benar."
        galat={galat.namaQris}
      />
      <Bidang
        label="Catatan (opsional)"
        name="catatan"
        maxLength={200}
        placeholder="mis. Konfirmasi infak ke WhatsApp DKM 0812xxxx"
        defaultValue={infak.catatan}
        galat={galat.catatan}
      />
      <Centang label="Tampilkan di layar TV" name="tampilTv" defaultChecked={infak.tampilTv} />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>Simpan informasi infak</TombolKirim>
    </form>
  );
}

export function FormQris() {
  const form = useFormAksi(unggahQris);
  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <InputFoto
        name="qris"
        label="Pilih gambar QRIS"
        wajib
        petunjuk="Gambar/screenshot QRIS dari bank, sebaiknya terpotong rapi di sekitar kode. Maks. 5 MB."
      />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>
        <IkonUnggah className="size-4" /> {form.pending ? "Mengunggah…" : "Unggah QRIS"}
      </TombolKirim>
    </form>
  );
}

export function TombolHapusQris() {
  const form = useFormAksi(hapusQris, { resetSaatSukses: false, konfirmasi: "Hapus gambar QRIS?" });
  return (
    <form onSubmit={form.onSubmit} className="space-y-2">
      <button
        type="submit"
        disabled={form.pending}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        <IkonSampah className="size-3.5" /> {form.pending ? "Menghapus…" : "Hapus QRIS"}
      </button>
      <PesanHasil hasil={form.hasil} />
    </form>
  );
}
