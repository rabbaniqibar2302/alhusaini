"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { IkonBintang, IkonPensil, IkonSampah, IkonUnggah } from "@/components/ikon";
import { MAKS_FOTO_KEGIATAN, MAKS_KETERANGAN_KEGIATAN } from "@/lib/batas";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { FotoBerId, KegiatanItem } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import {
  hapusFotoKegiatan,
  hapusKegiatan,
  jadikanSampulKegiatan,
  simpanKegiatan,
  tambahFotoKegiatan,
} from "@/server/aksi/kegiatan";
import { AreaTeks } from "./area-teks";
import { PilihBanyakFoto, pesanUnggah, unggahBerurutan, type FotoTerpilih } from "./pilih-banyak-foto";
import { Bidang, Kartu, Lencana, PesanHasil, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

const GAGAL_TERHUBUNG: HasilAksi = {
  ok: false,
  pesan: "Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.",
};

function kirimFotoKe(idKegiatan: string) {
  return (file: File) => {
    const fd = new FormData();
    fd.set("id", idKegiatan);
    fd.set("foto", file);
    return tambahFotoKegiatan(HASIL_AWAL, fd);
  };
}

/* ----------------------------- Form kegiatan ----------------------------- */

function FormKegiatan({
  item,
  hariIni,
  onSelesai,
  onBatal,
}: {
  item: KegiatanItem | null;
  hariIni: string;
  onSelesai: (hasil: HasilAksi) => void;
  onBatal?: () => void;
}) {
  const router = useRouter();
  const [foto, setFoto] = useState<FotoTerpilih[]>([]);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilAksi>(HASIL_AWAL);
  const galat = hasil.galat ?? {};
  const prefiks = item ? `ubah-${item.id}` : "baru";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    const form = e.currentTarget;
    setHasil(HASIL_AWAL);
    setSibuk("Menyimpan kegiatan…");
    try {
      const h = await simpanKegiatan(HASIL_AWAL, new FormData(form));
      if (!h) return; // sesi berakhir: dialihkan ke halaman login
      if (!h.ok) {
        setHasil(h);
        return;
      }
      let akhir = h;
      if (!item && h.idBaru && foto.length > 0) {
        const r = await unggahBerurutan(foto, kirimFotoKe(h.idBaru), (ke, total) =>
          setSibuk(`Mengunggah foto ${ke} dari ${total}…`),
        );
        akhir = pesanUnggah("Kegiatan ditambahkan.", foto.length, r);
      }
      onSelesai(akhir);
      router.refresh();
    } catch {
      setHasil(GAGAL_TERHUBUNG);
    } finally {
      setSibuk(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Bidang
        label="Nama kegiatan"
        name="judul"
        id={`${prefiks}-judul`}
        required
        minLength={3}
        maxLength={120}
        defaultValue={item?.judul}
        placeholder="mis. Santunan anak yatim"
        galat={galat.judul}
      />
      <Bidang
        label="Tanggal kegiatan"
        name="tanggal"
        id={`${prefiks}-tanggal`}
        type="date"
        required
        defaultValue={item?.tanggal ?? hariIni}
        petunjuk="Tanggal yang akan datang ditandai sebagai agenda."
        galat={galat.tanggal}
      />
      <AreaTeks
        label="Keterangan"
        name="keterangan"
        id={`${prefiks}-keterangan`}
        rows={5}
        maxLength={MAKS_KETERANGAN_KEGIATAN}
        defaultValue={item?.keterangan}
        placeholder="Ceritakan singkat kegiatannya: siapa, apa, dan di mana."
        petunjuk="Boleh beberapa paragraf. Tekan Enter untuk baris baru."
        galat={galat.keterangan}
      />
      {!item && (
        <PilihBanyakFoto
          id="kegiatan-foto-baru"
          label="Foto kegiatan (opsional)"
          sisa={MAKS_FOTO_KEGIATAN}
          foto={foto}
          onUbah={setFoto}
          disabled={sibuk !== null}
        />
      )}
      {!hasil.ok && <PesanHasil hasil={hasil} />}
      {sibuk && (
        <p role="status" className="text-sm font-medium text-hijau-800">
          {sibuk}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <TombolKirim pending={sibuk !== null}>
          {item ? "Simpan perubahan" : foto.length > 0 ? `Simpan kegiatan & ${foto.length} foto` : "Simpan kegiatan"}
        </TombolKirim>
        {onBatal && (
          <button
            type="button"
            onClick={onBatal}
            disabled={sibuk !== null}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

/* --------------------------- Foto satu kegiatan --------------------------- */

function TombolIkon({
  pending,
  label,
  bahaya = false,
  children,
}: {
  pending: boolean;
  label: string;
  bahaya?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className={`rounded-full bg-white/90 p-1.5 shadow ring-1 ring-black/10 disabled:opacity-50 ${
        bahaya ? "text-red-700 hover:bg-red-50" : "text-emas-700 hover:bg-emas-50"
      }`}
    >
      {children}
    </button>
  );
}

function ThumbFoto({ idKegiatan, foto, sampul }: { idKegiatan: string; foto: FotoBerId; sampul: boolean }) {
  const formSampul = useFormAksi(jadikanSampulKegiatan, { resetSaatSukses: false });
  const formHapus = useFormAksi(hapusFotoKegiatan, { resetSaatSukses: false, konfirmasi: "Hapus foto ini?" });
  const galat = [formSampul.hasil, formHapus.hasil].find((h) => !h.ok && h.pesan);
  return (
    <li>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200">
        <Image src={foto.url} alt="" fill sizes="120px" className="object-cover" />
        {sampul && (
          <span className="absolute bottom-1 left-1 rounded-full bg-emas-400 px-1.5 py-0.5 text-[0.65rem] font-bold text-hijau-950">
            Sampul
          </span>
        )}
        <div className="absolute top-1 right-1 flex gap-1">
          {!sampul && (
            <form onSubmit={formSampul.onSubmit}>
              <input type="hidden" name="id" value={idKegiatan} />
              <input type="hidden" name="fotoId" value={foto.id} />
              <TombolIkon pending={formSampul.pending} label="Jadikan foto utama">
                <IkonBintang className="size-3.5" />
              </TombolIkon>
            </form>
          )}
          <form onSubmit={formHapus.onSubmit}>
            <input type="hidden" name="id" value={idKegiatan} />
            <input type="hidden" name="fotoId" value={foto.id} />
            <TombolIkon pending={formHapus.pending} label="Hapus foto" bahaya>
              <IkonSampah className="size-3.5" />
            </TombolIkon>
          </form>
        </div>
      </div>
      {galat && <p className="mt-1 text-[0.7rem] text-red-700">{galat.pesan}</p>}
    </li>
  );
}

function FotoKegiatan({ item }: { item: KegiatanItem }) {
  const router = useRouter();
  const [foto, setFoto] = useState<FotoTerpilih[]>([]);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilAksi>(HASIL_AWAL);
  const sisa = MAKS_FOTO_KEGIATAN - item.foto.length;

  async function unggah() {
    if (sibuk || foto.length === 0) return;
    setHasil(HASIL_AWAL);
    const r = await unggahBerurutan(foto, kirimFotoKe(item.id), (ke, total) =>
      setSibuk(`Mengunggah foto ${ke} dari ${total}…`),
    );
    setHasil(pesanUnggah("", foto.length, r));
    setFoto([]);
    setSibuk(null);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-3 border-t border-stone-100 pt-3">
      {item.foto.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {item.foto.map((f, i) => (
            <ThumbFoto key={f.id} idKegiatan={item.id} foto={f} sampul={i === 0} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-stone-500">Belum ada foto untuk kegiatan ini.</p>
      )}
      {sisa > 0 ? (
        <details className="group rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200">
          <summary className="cursor-pointer text-sm font-semibold text-hijau-800">
            Tambah foto ({item.foto.length}/{MAKS_FOTO_KEGIATAN})
          </summary>
          <div className="mt-3 space-y-3 pb-1">
            <PilihBanyakFoto
              id={`foto-${item.id}`}
              label="Pilih foto"
              sisa={sisa}
              foto={foto}
              onUbah={setFoto}
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
              disabled={sibuk !== null || foto.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-hijau-800 px-4 py-2 text-sm font-semibold text-white hover:bg-hijau-700 disabled:opacity-50"
            >
              <IkonUnggah className="size-4" /> Unggah {foto.length > 0 ? `${foto.length} foto` : "foto"}
            </button>
          </div>
        </details>
      ) : (
        <p className="text-xs text-stone-500">Jumlah foto sudah maksimal ({MAKS_FOTO_KEGIATAN}).</p>
      )}
      <PesanHasil hasil={hasil} />
    </div>
  );
}

/* ------------------------------ Kartu & daftar ------------------------------ */

function KartuKegiatanAdmin({ item, hariIni }: { item: KegiatanItem; hariIni: string }) {
  const [ubah, setUbah] = useState(false);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);
  const formHapus = useFormAksi(hapusKegiatan, {
    resetSaatSukses: false,
    konfirmasi: `Hapus kegiatan "${item.judul}"${item.foto.length ? ` beserta ${item.foto.length} fotonya` : ""}?`,
  });

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      {ubah ? (
        <FormKegiatan
          item={item}
          hariIni={hariIni}
          onSelesai={(h) => {
            setUbah(false);
            setPesan(h);
          }}
          onBatal={() => setUbah(false)}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold break-words text-hijau-900">{item.judul}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                {formatTanggal(item.tanggal, { hari: true })} · {item.foto.length} foto
                {item.tanggal > hariIni && <Lencana warna="biru">Akan datang</Lencana>}
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <button
                type="button"
                onClick={() => {
                  setPesan(HASIL_AWAL);
                  setUbah(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
              >
                <IkonPensil className="size-3.5" /> Edit
              </button>
              <form onSubmit={formHapus.onSubmit}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  disabled={formHapus.pending}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                >
                  <IkonSampah className="size-3.5" /> {formHapus.pending ? "Menghapus…" : "Hapus"}
                </button>
              </form>
            </div>
          </div>
          {item.keterangan && (
            <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-stone-700">{item.keterangan}</p>
          )}
        </>
      )}
      {pesan.pesan && !ubah && (
        <div className="mt-3">
          <PesanHasil hasil={pesan} />
        </div>
      )}
      {!formHapus.hasil.ok && formHapus.hasil.pesan && (
        <div className="mt-3">
          <PesanHasil hasil={formHapus.hasil} />
        </div>
      )}
      <FotoKegiatan item={item} />
    </li>
  );
}

export function KelolaKegiatan({ items, hariIni }: { items: KegiatanItem[]; hariIni: string }) {
  const [putaran, setPutaran] = useState(0);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Kartu judul="Tambah kegiatan" deskripsi="Isi nama, tanggal, dan keterangan. Foto bisa dipilih beberapa sekaligus.">
        {pesan.pesan && (
          <div className="mb-4">
            <PesanHasil hasil={pesan} />
          </div>
        )}
        <FormKegiatan
          // Form dibuat ulang setelah berhasil supaya semua isian kosong kembali.
          key={putaran}
          item={null}
          hariIni={hariIni}
          onSelesai={(h) => {
            setPesan(h);
            setPutaran((p) => p + 1);
          }}
        />
      </Kartu>
      <Kartu
        judul={`Daftar kegiatan (${items.length})`}
        deskripsi="Kegiatan terbaru tampil paling atas. Foto pertama menjadi foto utama (sampul)."
      >
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
            Belum ada kegiatan. Tambahkan melalui form.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <KartuKegiatanAdmin key={item.id} item={item} hariIni={hariIni} />
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
