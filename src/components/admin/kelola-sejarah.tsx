"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IkonKanan, IkonKiri, IkonPensil, IkonSampah, IkonUnggah } from "@/components/ikon";
import { MAKS_FOTO_SEJARAH, MAKS_NARASI } from "@/lib/batas";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { FotoSejarah } from "@/lib/schemas";
import {
  hapusFotoSejarah,
  pindahFotoSejarah,
  simpanNarasiSejarah,
  tambahFotoSejarah,
  ubahKeteranganFotoSejarah,
} from "@/server/aksi/sejarah";
import { AreaTeks } from "./area-teks";
import { PilihBanyakFoto, pesanUnggah, unggahBerurutan, type FotoTerpilih } from "./pilih-banyak-foto";
import { Bidang, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

export function FormNarasiSejarah({ narasi }: { narasi: string }) {
  const form = useFormAksi(simpanNarasiSejarah, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <AreaTeks
        label="Narasi sejarah masjid"
        name="narasi"
        rows={16}
        maxLength={MAKS_NARASI}
        defaultValue={narasi}
        placeholder="Tuliskan sejarah berdirinya masjid: tahun pendirian, para pendiri/wakif, perkembangan pembangunan, dan seterusnya."
        petunjuk="Pisahkan paragraf dengan baris kosong (tekan Enter dua kali)."
        galat={galat.narasi}
      />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>{form.pending ? "Menyimpan…" : "Simpan narasi"}</TombolKirim>
    </form>
  );
}

const gayaTombolKecil =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ring-1 disabled:cursor-not-allowed disabled:opacity-40";

function ItemFotoSejarah({ foto, indeks, total }: { foto: FotoSejarah; indeks: number; total: number }) {
  const [ubah, setUbah] = useState(false);
  const formKet = useFormAksi(ubahKeteranganFotoSejarah, {
    resetSaatSukses: false,
    onSelesai: (h) => {
      if (h.ok) setUbah(false);
    },
  });
  const formPindah = useFormAksi(pindahFotoSejarah, { resetSaatSukses: false });
  const formHapus = useFormAksi(hapusFotoSejarah, {
    resetSaatSukses: false,
    konfirmasi: "Hapus foto ini dari sejarah masjid?",
  });
  const galat = [formKet.hasil, formPindah.hasil, formHapus.hasil].find((h) => !h.ok && h.pesan);

  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={foto.url}
          alt={foto.keterangan || `Foto sejarah ${indeks + 1}`}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 90vw"
          className="object-cover"
        />
        <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          {indeks + 1}
        </span>
      </div>
      <div className="space-y-2 p-2.5">
        {ubah ? (
          <form onSubmit={formKet.onSubmit} className="space-y-2">
            <input type="hidden" name="fotoId" value={foto.id} />
            <Bidang
              label="Keterangan foto"
              name="keterangan"
              id={`keterangan-${foto.id}`}
              defaultValue={foto.keterangan}
              maxLength={150}
              placeholder="mis. Peletakan batu pertama, 1985"
              galat={formKet.hasil.galat?.keterangan}
            />
            <div className="flex gap-2">
              <TombolKirim pending={formKet.pending} className="py-1.5 text-xs">
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
          <p className="text-sm break-words text-stone-700">
            {foto.keterangan || <span className="text-stone-400 italic">Tanpa keterangan</span>}
          </p>
        )}
        {!ubah && (
          <div className="flex flex-wrap items-center gap-1.5">
            <form onSubmit={formPindah.onSubmit} className="flex gap-1.5">
              <input type="hidden" name="fotoId" value={foto.id} />
              <button
                type="submit"
                name="arah"
                value="-1"
                disabled={indeks === 0 || formPindah.pending}
                aria-label="Pindah ke kiri (lebih awal)"
                title="Pindah ke kiri"
                className={`${gayaTombolKecil} text-stone-700 ring-stone-300 hover:bg-stone-50`}
              >
                <IkonKiri className="size-3.5" />
              </button>
              <button
                type="submit"
                name="arah"
                value="1"
                disabled={indeks === total - 1 || formPindah.pending}
                aria-label="Pindah ke kanan (lebih akhir)"
                title="Pindah ke kanan"
                className={`${gayaTombolKecil} text-stone-700 ring-stone-300 hover:bg-stone-50`}
              >
                <IkonKanan className="size-3.5" />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setUbah(true)}
              className={`${gayaTombolKecil} text-hijau-800 ring-hijau-200 hover:bg-hijau-50`}
            >
              <IkonPensil className="size-3.5" /> Keterangan
            </button>
            <form onSubmit={formHapus.onSubmit}>
              <input type="hidden" name="fotoId" value={foto.id} />
              <button
                type="submit"
                disabled={formHapus.pending}
                className={`${gayaTombolKecil} text-red-700 ring-red-200 hover:bg-red-50`}
              >
                <IkonSampah className="size-3.5" /> Hapus
              </button>
            </form>
          </div>
        )}
        {galat && <p className="text-xs text-red-700">{galat.pesan}</p>}
      </div>
    </li>
  );
}

export function KelolaFotoSejarah({ foto }: { foto: FotoSejarah[] }) {
  const router = useRouter();
  const [terpilih, setTerpilih] = useState<FotoTerpilih[]>([]);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilAksi>(HASIL_AWAL);
  const sisa = MAKS_FOTO_SEJARAH - foto.length;

  async function unggah() {
    if (sibuk || terpilih.length === 0) return;
    setHasil(HASIL_AWAL);
    const r = await unggahBerurutan(
      terpilih,
      (file) => {
        const fd = new FormData();
        fd.set("foto", file);
        fd.set("keterangan", "");
        return tambahFotoSejarah(HASIL_AWAL, fd);
      },
      (ke, total) => setSibuk(`Mengunggah foto ${ke} dari ${total}…`),
    );
    setHasil(pesanUnggah("", terpilih.length, r));
    setTerpilih([]);
    setSibuk(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {sisa > 0 ? (
        <div className="space-y-3 rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
          <PilihBanyakFoto
            id="foto-sejarah-baru"
            label="Tambah foto sejarah"
            sisa={sisa}
            foto={terpilih}
            onUbah={setTerpilih}
            disabled={sibuk !== null}
          />
          {sibuk && (
            <p role="status" className="text-sm font-medium text-hijau-800">
              {sibuk}
            </p>
          )}
          <button
            type="button"
            onClick={unggah}
            disabled={sibuk !== null || terpilih.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-hijau-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hijau-700 disabled:opacity-50"
          >
            <IkonUnggah className="size-4" /> Unggah {terpilih.length > 0 ? `${terpilih.length} foto` : "foto"}
          </button>
          <p className="text-xs text-stone-500">Keterangan tiap foto bisa diisi setelah foto terunggah.</p>
        </div>
      ) : (
        <p className="text-sm text-stone-600">Jumlah foto sudah maksimal ({MAKS_FOTO_SEJARAH}). Hapus foto lama untuk menambah.</p>
      )}
      <PesanHasil hasil={hasil} />
      {foto.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
          Belum ada foto sejarah.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {foto.map((f, i) => (
            <ItemFotoSejarah key={f.id} foto={f} indeks={i} total={foto.length} />
          ))}
        </ul>
      )}
    </div>
  );
}
