import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { KegiatanTampil } from "@/components/publik/daftar-kegiatan";
import { agendaMendatang } from "@/lib/agenda";
import { adaInfak } from "@/lib/infak";
import { adaLaporanKas } from "@/lib/kas";
import type { KegiatanItem, Konten } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import { bacaSemuaKonten, kontenCadangan } from "./store";

/**
 * Konten untuk halaman publik. Bila database sedang bermasalah, halaman tetap
 * tampil dengan konten cadangan (daftar kosong) dan `gagal: true`, supaya
 * halaman itu hanya di-cache sebentar.
 */
export async function bacaKontenPublik(hariIni: string): Promise<{ konten: Konten; gagal: boolean }> {
  try {
    return { konten: await bacaSemuaKonten(hariIni), gagal: false };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[publik] Gagal membaca database:", err);
    return { konten: kontenCadangan(hariIni), gagal: true };
  }
}

/** Bagian agenda, infak, dan laporan kas hanya tampil (beserta menunya) bila ada isinya. */
export function bagianTambahan(konten: Konten, hariIni: string) {
  return {
    agenda: agendaMendatang(konten.agenda, hariIni).length > 0,
    infak: adaInfak(konten.infak),
    kas: konten.setelanKas.tampilWebsite && adaLaporanKas(konten.kas, konten.setelanKas),
  };
}

export function kegiatanTampil(items: KegiatanItem[], hariIni: string): KegiatanTampil[] {
  return items.map((k) => ({
    id: k.id,
    judul: k.judul,
    tanggalTampil: formatTanggal(k.tanggal, { hari: true }),
    akanDatang: k.tanggal > hariIni,
    keterangan: k.keterangan,
    foto: k.foto.map((f, i) => ({
      id: f.id,
      url: f.url,
      lebar: f.lebar,
      tinggi: f.tinggi,
      alt: k.foto.length > 1 ? `${k.judul} (foto ${i + 1})` : k.judul,
      keterangan: k.judul,
    })),
  }));
}
