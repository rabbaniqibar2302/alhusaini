"use client";

import { useState } from "react";
import { IkonPensil, IkonPeringatan, IkonSampah } from "@/components/ikon";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { JenisJadwal } from "@/lib/schemas";
import { HARI_PEKAN } from "@/lib/time";
import { hapusJadwal, hapusJadwalLewat, simpanJadwal } from "@/server/aksi/jadwal";
import { KONFIGURASI_JADWAL, OPSI_HARI, peringatanHari, type ItemJadwalUmum } from "./konfigurasi-jadwal";
import { Bidang, Kartu, Lencana, PesanHasil, Pilihan, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

const teks = (v: unknown) => (typeof v === "string" ? v : "");

function FormJadwal({
  jenis,
  item,
  nilaiAwal,
  onSelesai,
  onBatal,
}: {
  jenis: JenisJadwal;
  item: ItemJadwalUmum | null;
  nilaiAwal: Record<string, string>;
  onSelesai: (hasil: HasilAksi) => void;
  onBatal: () => void;
}) {
  const k = KONFIGURASI_JADWAL[jenis];
  const awal = (nama: string) => (item ? teks(item[nama]) : (nilaiAwal[nama] ?? ""));
  const [tanggal, setTanggal] = useState(awal("tanggal"));
  const form = useFormAksi(simpanJadwal, {
    onSelesai: (h) => {
      if (h.ok) onSelesai(h);
    },
  });
  const galat = form.hasil.galat ?? {};
  const peringatan = k.bertanggal ? peringatanHari(jenis, tanggal) : null;

  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="jenis" value={jenis} />
      {item && <input type="hidden" name="id" value={item.id} />}
      {k.field.map((f) =>
        f.tipe === "hari" ? (
          <Pilihan
            key={f.nama}
            label={f.label}
            name={f.nama}
            required={f.wajib}
            defaultValue={awal(f.nama) || HARI_PEKAN[0]}
            opsi={OPSI_HARI}
            galat={galat[f.nama]}
          />
        ) : (
          <Bidang
            key={f.nama}
            label={f.label}
            name={f.nama}
            type={f.tipe}
            required={f.wajib}
            maxLength={f.maks}
            placeholder={f.placeholder}
            defaultValue={awal(f.nama)}
            onChange={f.tipe === "date" ? (e) => setTanggal(e.currentTarget.value) : undefined}
            galat={galat[f.nama]}
          />
        ),
      )}
      {peringatan && (
        <p className="flex items-center gap-1.5 text-xs text-emas-700">
          <IkonPeringatan className="size-4" /> {peringatan} Pastikan tanggalnya benar.
        </p>
      )}
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
      <div className="flex flex-wrap gap-2">
        <TombolKirim pending={form.pending}>{item ? "Simpan perubahan" : "Tambah jadwal"}</TombolKirim>
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

function TombolHapus({ jenis, id, nama }: { jenis: JenisJadwal; id: string; nama: string }) {
  const form = useFormAksi(hapusJadwal, { konfirmasi: `Hapus jadwal "${nama}"?`, resetSaatSukses: false });
  return (
    <form onSubmit={form.onSubmit}>
      <input type="hidden" name="jenis" value={jenis} />
      <input type="hidden" name="id" value={id} />
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

function TombolHapusLewat({ jenis, jumlah }: { jenis: JenisJadwal; jumlah: number }) {
  const form = useFormAksi(hapusJadwalLewat, {
    konfirmasi: `Hapus ${jumlah} jadwal yang tanggalnya sudah lewat?`,
    resetSaatSukses: false,
  });
  return (
    <form onSubmit={form.onSubmit} className="text-right">
      <input type="hidden" name="jenis" value={jenis} />
      <TombolKirim pending={form.pending} varian="sekunder" className="py-1.5 text-xs">
        Bersihkan {jumlah} jadwal lama
      </TombolKirim>
      {form.hasil.pesan && <p className="mt-1 text-xs text-stone-600">{form.hasil.pesan}</p>}
    </form>
  );
}

export function KelolaJadwal({
  jenis,
  items,
  hariIni,
}: {
  jenis: JenisJadwal;
  items: ItemJadwalUmum[];
  hariIni: string;
}) {
  const k = KONFIGURASI_JADWAL[jenis];
  const [sedangEdit, setSedangEdit] = useState<ItemJadwalUmum | null>(null);
  const [putaran, setPutaran] = useState(0);
  // Pesan sukses disimpan di sini karena form di-remount setelah berhasil.
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);

  const urutanHari = (x: ItemJadwalUmum) => HARI_PEKAN.indexOf(teks(x.hari) as (typeof HARI_PEKAN)[number]);
  const daftar = [...items].sort(
    (a, b) =>
      teks(a.tanggal).localeCompare(teks(b.tanggal)) ||
      urutanHari(a) - urutanHari(b) ||
      teks(a.jam).localeCompare(teks(b.jam)),
  );
  const jumlahLewat = k.bertanggal ? daftar.filter((x) => teks(x.tanggal) < hariIni).length : 0;
  const nilaiAwal = k.nilaiAwal(items, hariIni);

  const mulaiEdit = (item: ItemJadwalUmum) => {
    setSedangEdit(item);
    setPesan(HASIL_AWAL);
    document.getElementById("form-jadwal")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div id="form-jadwal" className="scroll-mt-24">
        <Kartu
          judul={sedangEdit ? "Ubah jadwal" : "Tambah jadwal"}
          deskripsi={sedangEdit ? "Perbarui data lalu simpan." : k.deskripsi}
        >
          {pesan.pesan && (
            <div className="mb-4">
              <PesanHasil hasil={pesan} />
            </div>
          )}
          <FormJadwal
            // Nilai default (mis. Jumat berikutnya) ikut jadi key supaya form tambah
            // dibuat ulang begitu daftar terbaru dari server tiba.
            key={sedangEdit ? `edit-${sedangEdit.id}` : `baru-${putaran}-${JSON.stringify(nilaiAwal)}`}
            jenis={jenis}
            item={sedangEdit}
            nilaiAwal={nilaiAwal}
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
        judul={`Daftar jadwal (${daftar.length})`}
        deskripsi="Perubahan langsung tampil di halaman depan."
        aksi={jumlahLewat > 0 ? <TombolHapusLewat jenis={jenis} jumlah={jumlahLewat} /> : undefined}
      >
        {daftar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada jadwal. Tambahkan melalui form.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {daftar.map((item) => {
              const r = k.ringkasan(item);
              const lewat = k.bertanggal && teks(item.tanggal) < hariIni;
              return (
                <li
                  key={item.id}
                  className={`flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between ${
                    sedangEdit?.id === item.id ? "-mx-2 rounded-xl bg-emas-50 px-2" : ""
                  } ${lewat ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 font-semibold text-hijau-900">
                      {r.judul}
                      {item.contoh && <Lencana>Contoh</Lencana>}
                      {lewat && <Lencana warna="abu">Sudah lewat</Lencana>}
                    </p>
                    <dl className="mt-1 space-y-0.5 text-sm">
                      {r.baris.map(([label, nilai]) => (
                        <div key={label} className="flex gap-2">
                          <dt className="w-20 shrink-0 text-stone-500">{label}</dt>
                          <dd className="min-w-0 break-words text-stone-800">{nilai}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <button
                      type="button"
                      onClick={() => mulaiEdit(item)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                    >
                      <IkonPensil className="size-3.5" /> Edit
                    </button>
                    <TombolHapus jenis={jenis} id={item.id} nama={r.judul} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
