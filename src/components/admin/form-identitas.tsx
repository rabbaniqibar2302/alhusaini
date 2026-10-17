"use client";

import { useState, type ChangeEvent } from "react";
import { IkonPin } from "@/components/ikon";
import type { Identitas } from "@/lib/schemas";
import { LOKASI_SHOLAT } from "@/lib/site";
import { simpanIdentitas } from "@/server/aksi/identitas";
import { AreaTeks } from "./area-teks";
import { Bidang, Kartu, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

/** Tampilan seperti bagian atas halaman depan; ikut berubah sambil admin mengetik. */
function Pratinjau({ x }: { x: Identitas }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-hijau-950 px-5 py-6 text-white">
      <div className="pola-islami pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative">
        {x.namaArab.trim() && (
          <p lang="ar" dir="rtl" className="w-fit font-arab text-2xl text-emas-300">
            {x.namaArab}
          </p>
        )}
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-balance">{x.nama.trim() || "Nama masjid"}</p>
        {x.wilayah.trim() && <p className="text-sm text-hijau-100">{x.wilayah}</p>}
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-hijau-50">
          <IkonPin className="size-4 shrink-0 text-emas-300" />
          {x.alamat.trim() || "Alamat lengkap"}
        </p>
      </div>
    </div>
  );
}

export function FormIdentitas({ identitas }: { identitas: Identitas }) {
  const form = useFormAksi(simpanIdentitas, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  const [pratinjau, setPratinjau] = useState(identitas);
  const ubah = (kunci: keyof Identitas) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nilai = e.currentTarget.value;
    setPratinjau((p) => ({ ...p, [kunci]: nilai }));
  };

  return (
    // Layar lebar: form di kiri, pratinjau dan catatan di kanan. Ponsel: pratinjau dulu.
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <div className="lg:col-start-2 lg:row-start-1">
        <Kartu judul="Pratinjau" deskripsi="Ikut berubah saat Anda mengetik. Tekan Simpan agar tampil di website.">
          <Pratinjau x={pratinjau} />
        </Kartu>
      </div>

      <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <Kartu judul="Nama & alamat">
          <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
            <Bidang
              label="Nama masjid"
              name="nama"
              required
              maxLength={60}
              defaultValue={identitas.nama}
              onChange={ubah("nama")}
              placeholder="Masjid ..."
              petunjuk="Tampil di header, halaman depan, layar TV, dan judul halaman."
              galat={galat.nama}
            />
            <Bidang
              label="Nama dalam huruf Arab"
              name="namaArab"
              dir="rtl"
              lang="ar"
              maxLength={60}
              defaultValue={identitas.namaArab}
              onChange={ubah("namaArab")}
              placeholder="مسجد ..."
              inputClassName="font-arab text-xl!"
              petunjuk="Opsional. Tampil di halaman depan, footer, dan layar TV. Kosongkan bila tidak dipakai."
              galat={galat.namaArab}
            />
            <Bidang
              label="Wilayah"
              name="wilayah"
              maxLength={60}
              defaultValue={identitas.wilayah}
              onChange={ubah("wilayah")}
              placeholder="Kelurahan/kecamatan, kota"
              petunjuk="Tampil di bawah nama masjid pada header dan di judul halaman (hasil pencarian Google)."
              galat={galat.wilayah}
            />
            <AreaTeks
              label="Alamat lengkap"
              name="alamat"
              required
              rows={3}
              maxLength={250}
              defaultValue={identitas.alamat}
              onChange={ubah("alamat")}
              petunjuk="Tampil di halaman depan dan footer."
              galat={galat.alamat}
            />
            <Bidang
              label="Alamat singkat"
              name="alamatSingkat"
              maxLength={100}
              defaultValue={identitas.alamatSingkat}
              onChange={ubah("alamatSingkat")}
              placeholder="Jl. ..., kecamatan, kota"
              petunjuk="Untuk layar TV dan tombol Google Maps. Kosongkan untuk memakai alamat lengkap."
              galat={galat.alamatSingkat}
            />
            <PesanHasil hasil={form.hasil} />
            <TombolKirim pending={form.pending}>{form.pending ? "Menyimpan…" : "Simpan identitas"}</TombolKirim>
          </form>
        </Kartu>
      </div>

      <div className="lg:col-start-2 lg:row-start-2">
        <Kartu judul="Lokasi jadwal sholat">
          <p className="text-sm text-stone-700">
            Jadwal sholat di website dan layar TV memakai data Kemenag untuk wilayah{" "}
            <span className="font-semibold">{LOKASI_SHOLAT.kota}</span> (WIB). Lokasi ini diatur di kode
            (src/lib/site.ts), jadi tidak ikut berubah saat alamat di atas diganti.
          </p>
        </Kartu>
      </div>
    </div>
  );
}
