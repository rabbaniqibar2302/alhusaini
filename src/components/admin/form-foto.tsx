"use client";

import Image from "next/image";
import { useState } from "react";
import { IkonPensil, IkonSampah, IkonUnggah } from "@/components/ikon";
import type { Foto, JenisLegalitas } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import {
  hapusFotoGaleri,
  hapusFotoLegalitas,
  hapusFotoMasjid,
  simpanLegalitas,
  tambahFotoGaleri,
  ubahFotoGaleri,
  unggahFotoMasjid,
} from "@/server/aksi/foto";
import { InputFoto } from "./input-foto";
import { Bidang, Lencana, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

function TombolHapusKecil({ pending, label = "Hapus" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
    >
      <IkonSampah className="size-3.5" /> {pending ? "Menghapus…" : label}
    </button>
  );
}

/* ------------------------------ Foto masjid ------------------------------ */

export function FormFotoMasjid() {
  const form = useFormAksi(unggahFotoMasjid);
  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <InputFoto label="Pilih foto masjid baru" wajib />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>
        <IkonUnggah className="size-4" /> {form.pending ? "Mengunggah…" : "Unggah & ganti foto"}
      </TombolKirim>
    </form>
  );
}

export function TombolHapusFotoMasjid() {
  const form = useFormAksi(hapusFotoMasjid, {
    resetSaatSukses: false,
    konfirmasi: "Hapus foto masjid? Halaman depan akan memakai ilustrasi bawaan.",
  });
  return (
    <form onSubmit={form.onSubmit} className="space-y-2">
      <TombolHapusKecil pending={form.pending} label="Hapus foto" />
      <PesanHasil hasil={form.hasil} />
    </form>
  );
}

/* ------------------------------- Legalitas ------------------------------- */

export function FormLegalitas({ jenis, nomor, labelNomor }: { jenis: JenisLegalitas; nomor: string; labelNomor: string }) {
  const form = useFormAksi(simpanLegalitas);
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <input type="hidden" name="jenis" value={jenis} />
      <Bidang
        label={labelNomor}
        name="nomor"
        defaultValue={nomor}
        maxLength={60}
        placeholder="Sesuai dokumen resmi"
        galat={galat.nomor}
      />
      <InputFoto label="Foto bukti registrasi (opsional, untuk mengganti)" />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>{form.pending ? "Menyimpan…" : "Simpan"}</TombolKirim>
    </form>
  );
}

export function TombolHapusFotoLegalitas({ jenis }: { jenis: JenisLegalitas }) {
  const form = useFormAksi(hapusFotoLegalitas, {
    resetSaatSukses: false,
    konfirmasi: "Hapus foto bukti registrasi ini?",
  });
  return (
    <form onSubmit={form.onSubmit} className="space-y-2">
      <input type="hidden" name="jenis" value={jenis} />
      <TombolHapusKecil pending={form.pending} label="Hapus foto" />
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
    </form>
  );
}

/* --------------------------------- Galeri --------------------------------- */

export function FormTambahGaleri() {
  const form = useFormAksi(tambahFotoGaleri);
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <InputFoto label="Foto kegiatan" wajib />
      <Bidang
        label="Keterangan"
        name="keterangan"
        required
        minLength={3}
        maxLength={200}
        placeholder="mis. Mengantar warga ke RSUD Johar Baru"
        galat={galat.keterangan}
      />
      <Bidang label="Tanggal kegiatan (opsional)" name="tanggal" type="date" galat={galat.tanggal} />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>
        <IkonUnggah className="size-4" /> {form.pending ? "Mengunggah…" : "Tambah ke galeri"}
      </TombolKirim>
    </form>
  );
}

export type ItemGaleriAdmin = { id: string; foto: Foto; keterangan: string; tanggal: string; contoh?: boolean };

export function KartuItemGaleri({ item }: { item: ItemGaleriAdmin }) {
  const [ubah, setUbah] = useState(false);
  const formUbah = useFormAksi(ubahFotoGaleri, {
    resetSaatSukses: false,
    onSelesai: (h) => {
      if (h.ok) setUbah(false);
    },
  });
  const formHapus = useFormAksi(hapusFotoGaleri, {
    resetSaatSukses: false,
    konfirmasi: "Hapus foto ini dari galeri?",
  });
  const galat = formUbah.hasil.galat ?? {};

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={item.foto.url}
          alt={item.keterangan}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          unoptimized={item.foto.url.endsWith(".svg")}
          className="object-cover"
        />
        {item.contoh && (
          <span className="absolute top-2 left-2">
            <Lencana>Contoh</Lencana>
          </span>
        )}
      </div>
      <div className="space-y-3 p-3">
        {ubah ? (
          <form onSubmit={formUbah.onSubmit} className="space-y-3">
            <input type="hidden" name="id" value={item.id} />
            <Bidang
              label="Keterangan"
              name="keterangan"
              defaultValue={item.keterangan}
              required
              minLength={3}
              maxLength={200}
              galat={galat.keterangan}
            />
            <Bidang label="Tanggal (opsional)" name="tanggal" type="date" defaultValue={item.tanggal} galat={galat.tanggal} />
            {!formUbah.hasil.ok && <PesanHasil hasil={formUbah.hasil} />}
            <div className="flex gap-2">
              <TombolKirim pending={formUbah.pending} className="py-1.5 text-xs">
                Simpan
              </TombolKirim>
              <button
                type="button"
                onClick={() => setUbah(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm font-medium break-words text-stone-800">{item.keterangan}</p>
            {item.tanggal && <p className="text-xs text-stone-500">{formatTanggal(item.tanggal, { hari: true })}</p>}
            {formUbah.hasil.ok && formUbah.hasil.pesan && <PesanHasil hasil={formUbah.hasil} />}
          </>
        )}
        {!ubah && (
          <div className="flex flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={() => setUbah(true)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
            >
              <IkonPensil className="size-3.5" /> Ubah keterangan
            </button>
            <form onSubmit={formHapus.onSubmit}>
              <input type="hidden" name="id" value={item.id} />
              <TombolHapusKecil pending={formHapus.pending} />
            </form>
          </div>
        )}
        {!formHapus.hasil.ok && formHapus.hasil.pesan && <PesanHasil hasil={formHapus.hasil} />}
      </div>
    </li>
  );
}
