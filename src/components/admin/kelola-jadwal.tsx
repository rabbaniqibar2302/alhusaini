"use client";

import { useState } from "react";
import { IkonPensil, IkonPeringatan, IkonSampah } from "@/components/ikon";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { PolaJadwal } from "@/lib/kajian";
import type { JenisJadwal } from "@/lib/schemas";
import { HARI_PEKAN, isTanggalValid, namaHari } from "@/lib/time";
import { hapusJadwal, hapusJadwalLewat, simpanJadwal } from "@/server/aksi/jadwal";
import { KONFIGURASI_JADWAL, OPSI_HARI, peringatanHari, type ItemJadwalUmum } from "./konfigurasi-jadwal";
import { Bidang, Kartu, Lencana, PesanHasil, Pilihan, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

const teks = (v: unknown) => (typeof v === "string" ? v : "");

const PILIHAN_POLA: [PolaJadwal, string][] = [
  ["tanggal", "Tanggal tertentu"],
  ["mingguan", "Rutin setiap pekan"],
];

/** Pilihan waktu kajian: tanggal tertentu, atau rutin setiap pekan pada hari tertentu. */
function PilihWaktu({
  pola,
  onPola,
  tanggal,
  onTanggal,
  hari,
  onHari,
  galat,
}: {
  pola: PolaJadwal;
  onPola: (p: PolaJadwal) => void;
  tanggal: string;
  onTanggal: (t: string) => void;
  hari: string;
  onHari: (h: string) => void;
  galat: Record<string, string[] | undefined>;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-stone-700">
        Waktu pelaksanaan<span className="text-red-600"> *</span>
      </legend>
      <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 ring-1 ring-stone-200">
        {PILIHAN_POLA.map(([nilai, label]) => (
          <label
            key={nilai}
            className={`cursor-pointer rounded-lg px-2 py-2 text-center text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emas-400 ${
              pola === nilai ? "bg-white text-hijau-900 shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <input
              type="radio"
              name="pola"
              value={nilai}
              checked={pola === nilai}
              onChange={() => onPola(nilai)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
      {/* Keduanya tetap ada supaya isian tidak hilang saat berpindah pilihan; yang disembunyikan tidak dikirim. */}
      <div className="mt-3">
        <div hidden={pola !== "tanggal"}>
          <Bidang
            label="Tanggal"
            name="tanggal"
            type="date"
            required={pola === "tanggal"}
            disabled={pola !== "tanggal"}
            defaultValue={tanggal}
            onChange={(e) => onTanggal(e.currentTarget.value)}
            petunjuk={isTanggalValid(tanggal) ? `Hari ${namaHari(tanggal)}` : undefined}
            galat={galat.tanggal}
          />
        </div>
        <div hidden={pola !== "mingguan"}>
          <Pilihan
            label="Setiap hari"
            name="hari"
            required={pola === "mingguan"}
            disabled={pola !== "mingguan"}
            defaultValue={hari}
            onChange={(e) => onHari(e.currentTarget.value)}
            opsi={OPSI_HARI}
            galat={galat.hari}
          />
        </div>
      </div>
    </fieldset>
  );
}

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
  const [pola, setPola] = useState<PolaJadwal>(awal("pola") === "mingguan" ? "mingguan" : "tanggal");
  const [tanggal, setTanggal] = useState(awal("tanggal") || nilaiAwal.tanggal || "");
  const [hari, setHari] = useState(awal("hari") || nilaiAwal.hari || HARI_PEKAN[0]);
  const form = useFormAksi(simpanJadwal, {
    onSelesai: (h) => {
      if (h.ok) onSelesai(h);
    },
  });
  const galat = form.hasil.galat ?? {};
  const peringatan = peringatanHari(jenis, { pola, tanggal, hari });

  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="jenis" value={jenis} />
      {item && <input type="hidden" name="id" value={item.id} />}
      {k.field.map((f) =>
        f.tipe === "waktu" ? (
          <PilihWaktu
            key={f.nama}
            pola={pola}
            onPola={setPola}
            tanggal={tanggal}
            onTanggal={setTanggal}
            hari={hari}
            onHari={setHari}
            galat={galat}
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
  // Jadwal rutin mingguan (tanpa tanggal) di atas, lalu jadwal bertanggal dari yang terdekat.
  const daftar = [...items].sort(
    (a, b) =>
      teks(a.tanggal).localeCompare(teks(b.tanggal)) ||
      urutanHari(a) - urutanHari(b) ||
      teks(a.jam).localeCompare(teks(b.jam)),
  );
  const sudahLewat = (x: ItemJadwalUmum) => teks(x.tanggal) !== "" && teks(x.tanggal) < hariIni;
  const jumlahLewat = daftar.filter(sudahLewat).length;
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
              const lewat = sudahLewat(item);
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
                      {item.pola === "mingguan" && <Lencana warna="hijau">Rutin</Lencana>}
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
