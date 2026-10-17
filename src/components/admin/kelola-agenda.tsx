"use client";

import Image from "next/image";
import { useState } from "react";
import { IkonKalender, IkonPensil, IkonSampah } from "@/components/ikon";
import { agendaLewat, labelTanggalAgenda } from "@/lib/agenda";
import { MAKS_KETERANGAN_AGENDA } from "@/lib/batas";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { AgendaItem } from "@/lib/schemas";
import { hapusAgenda, hapusAgendaLewat, simpanAgenda } from "@/server/aksi/agenda";
import { AreaTeks } from "./area-teks";
import { InputFoto } from "./input-foto";
import { Bidang, Centang, Kartu, Lencana, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

function FormAgenda({
  item,
  hariIni,
  onSelesai,
  onBatal,
}: {
  item: AgendaItem | null;
  hariIni: string;
  onSelesai: (h: HasilAksi) => void;
  onBatal: () => void;
}) {
  const form = useFormAksi(simpanAgenda, { onSelesai: (h) => h.ok && onSelesai(h) });
  const galat = form.hasil.galat ?? {};
  const [tanggal, setTanggal] = useState(item?.tanggal ?? hariIni);
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Bidang
        label="Nama acara"
        name="judul"
        required
        maxLength={120}
        placeholder="mis. Tabligh Akbar Maulid Nabi"
        defaultValue={item?.judul}
        galat={galat.judul}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang
          label="Tanggal"
          name="tanggal"
          type="date"
          required
          defaultValue={item?.tanggal ?? hariIni}
          onChange={(e) => setTanggal(e.currentTarget.value)}
          galat={galat.tanggal}
        />
        <Bidang
          label="Sampai (opsional)"
          name="tanggalSelesai"
          type="date"
          min={tanggal}
          defaultValue={item?.tanggalSelesai}
          petunjuk="Untuk acara lebih dari sehari."
          galat={galat.tanggalSelesai}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Bidang label="Jam (opsional)" name="jam" type="time" defaultValue={item?.jam} galat={galat.jam} />
        <Bidang
          label="Lokasi (opsional)"
          name="lokasi"
          maxLength={120}
          placeholder="mis. Ruang utama masjid"
          defaultValue={item?.lokasi}
          galat={galat.lokasi}
        />
      </div>
      <AreaTeks
        label="Keterangan (opsional)"
        name="keterangan"
        rows={4}
        maxLength={MAKS_KETERANGAN_AGENDA}
        defaultValue={item?.keterangan}
        placeholder="Pengisi acara, susunan acara, atau informasi pendaftaran."
        galat={galat.keterangan}
      />
      {item?.poster && (
        <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-2 ring-1 ring-stone-200">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-200">
            <Image src={item.poster.url} alt="Poster saat ini" fill sizes="64px" className="object-cover" />
          </div>
          <Centang label="Hapus poster ini" name="hapusPoster" petunjuk="Atau pilih poster baru di bawah untuk menggantinya." />
        </div>
      )}
      <InputFoto
        name="poster"
        label={item?.poster ? "Ganti poster (opsional)" : "Poster / foto acara (opsional)"}
        petunjuk="Poster tampil utuh di website dan layar TV. JPG, PNG, atau WEBP, maks. 5 MB."
        galat={galat.poster}
      />
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
      <div className="flex flex-wrap gap-2">
        <TombolKirim pending={form.pending}>{item ? "Simpan perubahan" : "Tambah agenda"}</TombolKirim>
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

function TombolHapus({ item }: { item: AgendaItem }) {
  const form = useFormAksi(hapusAgenda, { resetSaatSukses: false, konfirmasi: `Hapus agenda "${item.judul}"?` });
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
    </form>
  );
}

function TombolBersihkan({ jumlah }: { jumlah: number }) {
  const form = useFormAksi(hapusAgendaLewat, {
    resetSaatSukses: false,
    konfirmasi: `Hapus ${jumlah} agenda yang sudah lewat beserta posternya?`,
  });
  return (
    <form onSubmit={form.onSubmit} className="text-right">
      <TombolKirim pending={form.pending} varian="sekunder" className="py-1.5 text-xs">
        Bersihkan {jumlah} agenda lama
      </TombolKirim>
      {form.hasil.pesan && <p className="mt-1 text-xs text-stone-600">{form.hasil.pesan}</p>}
    </form>
  );
}

export function KelolaAgenda({ items, hariIni }: { items: AgendaItem[]; hariIni: string }) {
  const [sedangEdit, setSedangEdit] = useState<AgendaItem | null>(null);
  const [putaran, setPutaran] = useState(0);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);
  const jumlahLewat = items.filter((x) => agendaLewat(x, hariIni)).length;

  const mulaiEdit = (x: AgendaItem) => {
    setSedangEdit(x);
    setPesan(HASIL_AWAL);
    document.getElementById("form-agenda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div id="form-agenda" className="scroll-mt-24">
        <Kartu
          judul={sedangEdit ? "Ubah agenda" : "Tambah agenda"}
          deskripsi="Acara yang akan datang. Setelah tanggalnya lewat, agenda otomatis tidak tampil lagi."
        >
          {pesan.pesan && (
            <div className="mb-4">
              <PesanHasil hasil={pesan} />
            </div>
          )}
          <FormAgenda
            key={sedangEdit ? `edit-${sedangEdit.id}` : `baru-${putaran}`}
            item={sedangEdit}
            hariIni={hariIni}
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
        judul={`Daftar agenda (${items.length})`}
        deskripsi="Tampil di website (bagian Agenda) dan layar TV, terdekat dulu."
        aksi={jumlahLewat > 0 ? <TombolBersihkan jumlah={jumlahLewat} /> : undefined}
      >
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada agenda. Tambahkan melalui form.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((x) => {
              const lewat = agendaLewat(x, hariIni);
              return (
                <li
                  key={x.id}
                  className={`flex gap-3 py-3 ${sedangEdit?.id === x.id ? "-mx-2 rounded-xl bg-emas-50 px-2" : ""} ${
                    lewat ? "opacity-60" : ""
                  }`}
                >
                  <div className="relative grid h-24 w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-lg bg-hijau-900 text-emas-300">
                    {x.poster ? (
                      <Image src={x.poster.url} alt="" fill sizes="72px" className="object-cover" />
                    ) : (
                      <IkonKalender className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 font-semibold text-hijau-900">
                      {x.judul}
                      {lewat && <Lencana warna="abu">Sudah lewat</Lencana>}
                      {!x.poster && <Lencana>Tanpa poster</Lencana>}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-600">
                      {labelTanggalAgenda(x)}
                      {x.jam && ` · ${x.jam} WIB`}
                    </p>
                    {x.lokasi && <p className="text-sm text-stone-500">{x.lokasi}</p>}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => mulaiEdit(x)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                      >
                        <IkonPensil className="size-3.5" /> Edit
                      </button>
                      <TombolHapus item={x} />
                    </div>
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
