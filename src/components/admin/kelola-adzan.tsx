"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { IkonSampah, IkonUnggah } from "@/components/ikon";
import {
  FORMAT_AUDIO,
  UKURAN_MAKS_AUDIO,
  deteksiFormatAudio,
  ukuranAudio,
  type FormatAudio,
  type JenisAdzan,
} from "@/lib/audio";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import type { Adzan, AudioAdzan } from "@/lib/schemas";
import { hapusAudioAdzan, simpanAudioAdzan } from "@/server/aksi/adzan";
import { PesanHasil } from "./ui";
import { useFormAksi } from "./use-form-aksi";

type FileTerpilih = { file: File; format: FormatAudio; pratinjau: string };

function pesanGagalUnggah(err: unknown): string {
  const nama = (err as Error)?.name ?? "";
  if (nama === "BlobFileTooLargeError") return "Ukuran file audio maksimal 15 MB.";
  if (nama === "BlobContentTypeNotAllowedError") return "File harus berupa audio MP3, M4A, atau OGG.";
  return "Gagal mengunggah. Periksa koneksi internet lalu coba lagi.";
}

function SlotAdzan({
  jenis,
  judul,
  keterangan,
  audio,
}: {
  jenis: JenisAdzan;
  judul: string;
  keterangan: string;
  audio: AudioAdzan | null;
}) {
  const router = useRouter();
  const [pilihan, setPilihan] = useState<FileTerpilih | null>(null);
  const [galat, setGalat] = useState("");
  const [tahap, setTahap] = useState<"unggah" | "periksa" | null>(null);
  const [hasil, setHasil] = useState<HasilAksi>(HASIL_AWAL);
  // Hasil hapus ditampilkan di tempat yang sama dengan hasil unggah (pesan terakhir saja),
  // karena bagian file lama hilang begitu file berhasil dihapus.
  const formHapus = useFormAksi(hapusAudioAdzan, {
    resetSaatSukses: false,
    konfirmasi: `Hapus file ${judul.toLowerCase()}?`,
    onSelesai: (h) => setHasil(h),
  });
  const id = `audio-${jenis}`;

  useEffect(() => {
    return () => {
      if (pilihan) URL.revokeObjectURL(pilihan.pratinjau);
    };
  }, [pilihan]);

  async function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    setGalat("");
    setHasil(HASIL_AWAL);
    setPilihan(null);
    if (!file) return;
    if (file.size > UKURAN_MAKS_AUDIO) {
      setGalat(`Ukuran file ${ukuranAudio(file.size)} melebihi batas 15 MB.`);
      return;
    }
    const format = deteksiFormatAudio(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (!format) {
      setGalat("File harus berupa audio MP3, M4A, atau OGG.");
      return;
    }
    setPilihan({ file, format, pratinjau: URL.createObjectURL(file) });
  }

  async function unggah() {
    if (!pilihan || tahap !== null) return;
    setHasil(HASIL_AWAL);
    setTahap("unggah");
    try {
      // Sengaja tanpa onUploadProgress: dengan itu SDK memakai fetch streaming yang di Chrome
      // hanya jalan lewat HTTP/2, sehingga gagal di jaringan/antivirus yang memaksa HTTP/1.1.
      const blob = await upload(`masjid/audio/${crypto.randomUUID()}.${pilihan.format}`, pilihan.file, {
        access: "public",
        handleUploadUrl: "/admin/unggah-audio",
        contentType: FORMAT_AUDIO[pilihan.format].mime,
      });
      setTahap("periksa");
      const fd = new FormData();
      fd.set("jenis", jenis);
      fd.set("url", blob.url);
      fd.set("nama", pilihan.file.name);
      const h = await simpanAudioAdzan(HASIL_AWAL, fd);
      if (!h) return; // sesi berakhir: dialihkan ke halaman login
      setHasil(h);
      if (h.ok) {
        setPilihan(null);
        router.refresh();
      }
    } catch (err) {
      setHasil({ ok: false, pesan: pesanGagalUnggah(err) });
    } finally {
      setTahap(null);
    }
  }

  return (
    <div className="rounded-xl bg-stone-50 p-4 ring-1 ring-stone-200">
      <p className="font-semibold text-hijau-900">{judul}</p>
      <p className="text-xs text-stone-500">{keterangan}</p>

      {audio ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm break-all text-stone-700">
            {audio.nama} <span className="text-stone-500">· {ukuranAudio(audio.ukuran)}</span>
          </p>
          <audio controls preload="none" src={audio.url} className="w-full" />
          <form onSubmit={formHapus.onSubmit}>
            <input type="hidden" name="jenis" value={jenis} />
            <button
              type="submit"
              disabled={formHapus.pending}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              <IkonSampah className="size-3.5" /> {formHapus.pending ? "Menghapus…" : "Hapus file"}
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-500 italic">Belum ada file.</p>
      )}

      <div className="mt-4 space-y-2 border-t border-stone-200 pt-3">
        <label htmlFor={id} className="block text-sm font-medium text-stone-700">
          {audio ? "Ganti file" : "Pilih file"}
        </label>
        <input
          id={id}
          type="file"
          accept=".mp3,.m4a,.ogg,audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg"
          onChange={saatPilih}
          disabled={tahap !== null}
          aria-describedby={`${id}-info`}
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-hijau-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hijau-700 disabled:opacity-60"
        />
        <p id={`${id}-info`} className={`text-xs ${galat ? "text-red-700" : "text-stone-500"}`}>
          {galat || "MP3 (disarankan), M4A, atau OGG, maksimal 15 MB."}
        </p>
        {pilihan && (
          <div className="space-y-2">
            <p className="text-sm break-all text-stone-700">
              {pilihan.file.name} <span className="text-stone-500">· {ukuranAudio(pilihan.file.size)}</span>
            </p>
            <audio controls src={pilihan.pratinjau} className="w-full" />
            {tahap !== null && (
              <div role="progressbar" aria-label="Mengunggah" className="h-2 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full w-full animate-pulse bg-hijau-600" />
              </div>
            )}
            <button
              type="button"
              onClick={unggah}
              disabled={tahap !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-hijau-800 px-4 py-2 text-sm font-semibold text-white hover:bg-hijau-700 disabled:opacity-60"
            >
              {tahap === null ? (
                <IkonUnggah className="size-4" />
              ) : (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              )}
              {tahap === null
                ? "Unggah & simpan"
                : tahap === "unggah"
                  ? `Mengunggah ${ukuranAudio(pilihan.file.size)}… mohon tunggu`
                  : "Memeriksa file…"}
            </button>
          </div>
        )}
        <PesanHasil hasil={hasil} />
      </div>
    </div>
  );
}

export function KelolaAdzan({ adzan }: { adzan: Adzan }) {
  return (
    <div className="space-y-4">
      <SlotAdzan
        jenis="umum"
        judul="Suara adzan"
        keterangan="Dipakai untuk Dzuhur, Ashar, Maghrib, Isya (dan Subuh bila file Subuh kosong)."
        audio={adzan.umum}
      />
      <SlotAdzan
        jenis="subuh"
        judul="Suara adzan Subuh (opsional)"
        keterangan="Adzan Subuh dengan lafaz “ash-shalatu khairun minan naum”."
        audio={adzan.subuh}
      />
    </div>
  );
}
