"use client";

import { useState } from "react";
import { IkonSampah, IkonUnggah } from "@/components/ikon";
import { PanggungPenceramah } from "@/components/kartu-penceramah";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import { kunciNama, type FotoPenceramah } from "@/lib/penceramah";
import { hapusFotoPenceramah, simpanFotoPenceramah } from "@/server/aksi/penceramah";
import { InputFotoPenceramah } from "./input-foto-penceramah";
import { Bidang, Kartu, Lencana, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

export type OrangPenceramah = {
  kunci: string;
  nama: string;
  /** id data foto (untuk dihapus); null bila belum ada foto. */
  id: string | null;
  foto: FotoPenceramah | null;
  /** Mis. ["Khotib Jumat (2)", "Kuliah Subuh (1)"]. */
  jadwal: string[];
};

function FormFoto({
  nama,
  onNama,
  orang,
  onSelesai,
}: {
  nama: string;
  onNama: (n: string) => void;
  orang: OrangPenceramah[];
  onSelesai: (h: HasilAksi) => void;
}) {
  const [olah, setOlah] = useState(false);
  const form = useFormAksi(simpanFotoPenceramah, { onSelesai: (h) => h.ok && onSelesai(h) });
  const cocok = orang.find((o) => o.kunci === kunciNama(nama));
  const galat = form.hasil.galat ?? {};

  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <Bidang
        label="Nama penceramah"
        name="nama"
        required
        maxLength={100}
        placeholder="Ust. ... / Ustadzah ..."
        value={nama}
        onChange={(e) => onNama(e.currentTarget.value)}
        list="daftar-penceramah"
        autoComplete="off"
        petunjuk="Tulis seperti di jadwal. Gelar (Ust., KH., Lc.) boleh berbeda, tetap dikenali."
        galat={galat.nama}
      />
      <datalist id="daftar-penceramah">
        {orang.map((o) => (
          <option key={o.kunci} value={o.nama} />
        ))}
      </datalist>
      <InputFotoPenceramah nama={nama} tersimpan={cocok?.foto ?? null} wajib galat={galat.foto} onSibuk={setOlah} />
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
      <TombolKirim pending={form.pending || olah}>{olah ? "Memproses foto…" : "Simpan foto"}</TombolKirim>
    </form>
  );
}

function TombolHapus({ id, nama }: { id: string; nama: string }) {
  const form = useFormAksi(hapusFotoPenceramah, { konfirmasi: `Hapus foto ${nama}?`, resetSaatSukses: false });
  return (
    <form onSubmit={form.onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={form.pending}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        <IkonSampah className="size-3.5" /> {form.pending ? "Menghapus…" : "Hapus"}
      </button>
      {!form.hasil.ok && form.hasil.pesan && <p className="mt-1 text-xs text-red-700">{form.hasil.pesan}</p>}
    </form>
  );
}

export function KelolaPenceramah({ orang }: { orang: OrangPenceramah[] }) {
  const [nama, setNama] = useState("");
  const [putaran, setPutaran] = useState(0);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);
  const tanpaFoto = orang.filter((o) => !o.foto).length;

  const pilih = (o: OrangPenceramah) => {
    setNama(o.nama);
    setPesan(HASIL_AWAL);
    document.getElementById("form-foto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div id="form-foto" className="scroll-mt-24">
        <Kartu
          judul="Unggah foto penceramah"
          deskripsi="Cukup foto orangnya; latar belakang dihapus otomatis. Foto dipakai di semua jadwal dengan nama yang sama."
        >
          {pesan.pesan && (
            <div className="mb-4">
              <PesanHasil hasil={pesan} />
            </div>
          )}
          <FormFoto
            key={putaran}
            nama={nama}
            onNama={setNama}
            orang={orang}
            onSelesai={(h) => {
              setPesan(h);
              setNama("");
              setPutaran((p) => p + 1);
            }}
          />
        </Kartu>
      </div>

      <Kartu
        judul={`Penceramah (${orang.length})`}
        deskripsi={
          tanpaFoto > 0
            ? `${tanpaFoto} penceramah di jadwal belum punya foto; kartunya memakai inisial nama.`
            : "Semua penceramah di jadwal sudah punya foto."
        }
      >
        {orang.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada penceramah. Isi jadwal khotib atau kajian terlebih dahulu, atau unggah foto lewat form.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {orang.map((o) => (
              <li key={o.kunci} className="flex flex-col rounded-2xl bg-stone-50 p-1.5 ring-1 ring-stone-200">
                <PanggungPenceramah
                  foto={o.foto}
                  nama={o.nama}
                  sizes="200px"
                  kelasInisial="text-3xl"
                  className="aspect-[4/5] rounded-xl"
                />
                <div className="flex flex-1 flex-col gap-1.5 px-1.5 pt-2 pb-1">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold text-hijau-900">{o.nama}</p>
                  <p className="text-[0.7rem] leading-snug text-stone-500">
                    {o.jadwal.length > 0 ? o.jadwal.join(" · ") : "Tidak ada di jadwal saat ini"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {!o.foto ? (
                      <Lencana warna="abu">Belum ada foto</Lencana>
                    ) : !o.foto.latarDihapus ? (
                      <Lencana>Dengan latar</Lencana>
                    ) : null}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => pilih(o)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                    >
                      <IkonUnggah className="size-3.5" /> {o.foto ? "Ganti" : "Unggah"}
                    </button>
                    {o.id && <TombolHapus id={o.id} nama={o.nama} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
