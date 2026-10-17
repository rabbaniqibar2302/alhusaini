"use client";

import { useState } from "react";
import { IkonPensil, IkonSampah } from "@/components/ikon";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import { pengumumanBerakhir } from "@/lib/pengumuman";
import type { PengumumanItem } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import { hapusPengumuman, hapusPengumumanBerakhir, simpanPengumuman } from "@/server/aksi/pengumuman";
import { Bidang, Centang, Kartu, Lencana, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

function FormPengumuman({
  item,
  onSelesai,
  onBatal,
}: {
  item: PengumumanItem | null;
  onSelesai: (hasil: HasilAksi) => void;
  onBatal: () => void;
}) {
  const form = useFormAksi(simpanPengumuman, {
    onSelesai: (h) => {
      if (h.ok) onSelesai(h);
    },
  });
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Bidang
        label="Isi pengumuman"
        name="teks"
        required
        minLength={3}
        maxLength={250}
        defaultValue={item?.teks}
        placeholder="mis. Kerja bakti membersihkan masjid, Ahad 08.00 WIB"
        petunjuk="Satu kalimat singkat, maks. 250 karakter."
        galat={galat.teks}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang
          label="Tampil mulai (opsional)"
          name="mulai"
          type="date"
          defaultValue={item?.mulai}
          galat={galat.mulai}
        />
        <Bidang
          label="Tampil sampai (opsional)"
          name="sampai"
          type="date"
          defaultValue={item?.sampai}
          petunjuk="Kosongkan bila tidak ada batas."
          galat={galat.sampai}
        />
      </div>
      <Centang
        label="Tampilkan juga di halaman depan website"
        name="diWebsite"
        defaultChecked={item?.diWebsite ?? false}
        petunjuk="Semua pengumuman aktif selalu tampil sebagai teks berjalan di layar TV."
      />
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
      <div className="flex flex-wrap gap-2">
        <TombolKirim pending={form.pending}>{item ? "Simpan perubahan" : "Tambah pengumuman"}</TombolKirim>
        {item && (
          <button
            type="button"
            onClick={onBatal}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

function TombolHapus({ item }: { item: PengumumanItem }) {
  const form = useFormAksi(hapusPengumuman, { resetSaatSukses: false, konfirmasi: "Hapus pengumuman ini?" });
  return (
    <form onSubmit={form.onSubmit}>
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        disabled={form.pending}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        <IkonSampah className="size-3.5" /> {form.pending ? "Menghapus…" : "Hapus"}
      </button>
      {!form.hasil.ok && form.hasil.pesan && <p className="mt-1 text-xs text-red-700">{form.hasil.pesan}</p>}
    </form>
  );
}

function TombolBersihkan({ jumlah }: { jumlah: number }) {
  const form = useFormAksi(hapusPengumumanBerakhir, {
    resetSaatSukses: false,
    konfirmasi: `Hapus ${jumlah} pengumuman yang masa tampilnya sudah berakhir?`,
  });
  return (
    <form onSubmit={form.onSubmit} className="text-right">
      <TombolKirim pending={form.pending} varian="sekunder" className="py-1.5 text-xs">
        Bersihkan {jumlah} yang berakhir
      </TombolKirim>
      {form.hasil.pesan && <p className="mt-1 text-xs text-stone-600">{form.hasil.pesan}</p>}
    </form>
  );
}

function statusPengumuman(x: PengumumanItem, hariIni: string) {
  if (pengumumanBerakhir(x, hariIni)) return <Lencana warna="abu">Berakhir</Lencana>;
  if (x.mulai && x.mulai > hariIni) return <Lencana warna="biru">Terjadwal</Lencana>;
  return <Lencana warna="hijau">Aktif</Lencana>;
}

function periode(x: PengumumanItem): string {
  if (x.mulai && x.sampai) {
    return x.mulai === x.sampai
      ? `Hanya ${formatTanggal(x.mulai, { singkat: true })}`
      : `${formatTanggal(x.mulai, { singkat: true })} – ${formatTanggal(x.sampai, { singkat: true })}`;
  }
  if (x.mulai) return `Mulai ${formatTanggal(x.mulai, { singkat: true })}`;
  if (x.sampai) return `Sampai ${formatTanggal(x.sampai, { singkat: true })}`;
  return "Tanpa batas waktu";
}

export function KelolaPengumuman({ items, hariIni }: { items: PengumumanItem[]; hariIni: string }) {
  const [sedangEdit, setSedangEdit] = useState<PengumumanItem | null>(null);
  const [putaran, setPutaran] = useState(0);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);
  const jumlahBerakhir = items.filter((x) => pengumumanBerakhir(x, hariIni)).length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div id="form-pengumuman" className="scroll-mt-24">
        <Kartu
          judul={sedangEdit ? "Ubah pengumuman" : "Tambah pengumuman"}
          deskripsi={sedangEdit ? "Perbarui isi lalu simpan." : "Pengumuman tampil di layar TV masjid dan, bila dipilih, di website."}
        >
          {pesan.pesan && (
            <div className="mb-4">
              <PesanHasil hasil={pesan} />
            </div>
          )}
          <FormPengumuman
            key={sedangEdit ? `edit-${sedangEdit.id}` : `baru-${putaran}`}
            item={sedangEdit}
            onSelesai={(h) => {
              setSedangEdit(null);
              setPutaran((p) => p + 1);
              setPesan(h);
            }}
            onBatal={() => {
              setSedangEdit(null);
              setPesan(HASIL_AWAL);
            }}
          />
        </Kartu>
      </div>

      <Kartu
        judul={`Daftar pengumuman (${items.length})`}
        deskripsi="Urutan di layar TV mengikuti urutan daftar ini."
        aksi={jumlahBerakhir > 0 ? <TombolBersihkan jumlah={jumlahBerakhir} /> : undefined}
      >
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada pengumuman.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((x) => (
              <li
                key={x.id}
                className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between ${
                  sedangEdit?.id === x.id ? "-mx-2 rounded-xl bg-emas-50 px-2" : ""
                } ${pengumumanBerakhir(x, hariIni) ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words text-stone-900">{x.teks}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                    {statusPengumuman(x, hariIni)}
                    {x.diWebsite && <Lencana warna="emas">Website</Lencana>}
                    {x.contoh && <Lencana>Contoh</Lencana>}
                    <span>{periode(x)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSedangEdit(x);
                      setPesan(HASIL_AWAL);
                      document.getElementById("form-pengumuman")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                  >
                    <IkonPensil className="size-3.5" /> Edit
                  </button>
                  <TombolHapus item={x} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
