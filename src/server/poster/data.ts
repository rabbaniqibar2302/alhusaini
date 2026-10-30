import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fotoUntuk, petaFotoPenceramah } from "@/lib/penceramah";
import {
  konteksPoster,
  posterAgenda,
  posterKajian,
  posterKhotib,
  type IsiPoster,
  type JenisPoster,
} from "@/lib/poster";
import { tanggalWIB } from "@/lib/time";
import { urlSitus } from "../situs";
import { TAG_KONTEN, bacaSemuaKonten } from "../store";

/**
 * Konten yang dipakai poster, satu entri cache untuk semua poster (bukan per
 * id), supaya permintaan dengan id acak tidak membaca database. Ditandai tag
 * konten seperti halaman publik, jadi ikut diperbarui begitu admin menyimpan.
 * Bila database tidak dapat dibaca, galatnya diteruskan (tidak di-cache).
 */
async function kontenPoster() {
  "use cache";
  cacheTag(TAG_KONTEN);
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const konten = await bacaSemuaKonten(tanggalWIB());
  return {
    khotib: konten.khotib,
    pengajianRabu: konten.pengajianRabu,
    kuliahSubuh: konten.kuliahSubuh,
    pengajianIbu: konten.pengajianIbu,
    agenda: konten.agenda,
    penceramah: konten.penceramah,
    konteks: konteksPoster(konten.identitas, konten.logo, urlSitus().origin),
  };
}

/** Isi poster satu jadwal; null bila jadwal tidak ada atau masih data contoh. */
export async function cariIsiPoster(jenis: JenisPoster, id: string): Promise<IsiPoster | null> {
  const k = await kontenPoster();
  const foto = petaFotoPenceramah(k.penceramah);

  if (jenis === "khotib") {
    const x = k.khotib.find((i) => i.id === id && !i.contoh);
    return x ? posterKhotib(x, fotoUntuk(foto, x.khotib), k.konteks) : null;
  }
  if (jenis === "agenda") {
    const x = k.agenda.find((i) => i.id === id && !i.contoh);
    return x ? posterAgenda(x, k.konteks) : null;
  }
  const x = k[jenis].find((i) => i.id === id && !i.contoh);
  return x ? posterKajian(jenis, x, fotoUntuk(foto, x.ustadz), k.konteks) : null;
}
