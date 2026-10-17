import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import type { DataHariBesar } from "@/components/publik/hitung-mundur-hari-besar";
import { LayarTv, type DataTv } from "@/components/tv/layar-tv";
import { ACARA, kejadianBerikutnya } from "@/lib/countdown";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { KUNCI_ACARA } from "@/lib/schemas";
import { petaFotoPenceramah } from "@/lib/penceramah";
import { alamatPendek } from "@/lib/site";
import { tambahHari, tanggalWIB } from "@/lib/time";
import { getJadwalSholat } from "@/server/jadwal-sholat";
import { bacaKontenPublik } from "@/server/konten-publik";
import { TAG_KONTEN } from "@/server/store";

export const metadata: Metadata = {
  title: "Layar TV",
  description: "Tampilan jadwal sholat dan informasi untuk TV di dalam masjid.",
  robots: { index: false, follow: false },
};

/**
 * Layar TV masjid. Seperti halaman depan, data diambil dari cache dan
 * diperbarui setelah admin menyimpan perubahan; layar memanggil ulang data
 * tiap 5 menit, sedangkan jam & hitung mundur berjalan di browser.
 */
export default async function HalamanTv() {
  "use cache";
  cacheTag(TAG_KONTEN);

  const hariIni = tanggalWIB();
  const besok = tambahHari(hariIni, 1);
  const [{ konten, gagal }, sholatHariIni, sholatBesok] = await Promise.all([
    bacaKontenPublik(hariIni),
    getJadwalSholat(hariIni),
    getJadwalSholat(besok),
  ]);
  if (gagal) cacheLife("minutes");
  else cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const koreksi = konten.countdown.koreksiHijriah;
  const hariBesar: DataHariBesar[] = KUNCI_ACARA.map((kunci) => ({
    kunci,
    judul: ACARA[kunci].judul,
    label: ACARA[kunci].label,
    ucapan: ACARA[kunci].ucapan,
    kejadian: kejadianBerikutnya(kunci, hariIni, konten.countdown, 2).map((k) => ({
      tanggal: k.tanggal,
      tahunHijriah: k.tahunHijriah,
      sumber: k.sumber,
      catatan: k.catatan,
    })),
  }));

  const data: DataTv = {
    identitas: {
      nama: konten.identitas.nama,
      namaArab: konten.identitas.namaArab,
      alamat: alamatPendek(konten.identitas),
    },
    sholat: [sholatHariIni, sholatBesok],
    hijriah: {
      [hariIni]: formatHijriah(keHijriah(hariIni, koreksi)),
      [besok]: formatHijriah(keHijriah(besok, koreksi)),
    },
    koreksiHijriah: koreksi,
    logo: konten.logo,
    fotoMasjid: konten.hero,
    pengumuman: konten.pengumuman,
    khotib: konten.khotib.filter((x) => x.tanggal >= hariIni),
    kajian: {
      pengajianRabu: konten.pengajianRabu,
      kuliahSubuh: konten.kuliahSubuh,
      pengajianIbu: konten.pengajianIbu,
    },
    penceramah: petaFotoPenceramah(konten.penceramah),
    kegiatan: konten.kegiatan
      .filter((k) => k.foto.length > 0)
      .slice(0, 4)
      .map((k) => ({ id: k.id, judul: k.judul, tanggal: k.tanggal, foto: k.foto[0] })),
    hariBesar,
    setelan: konten.tv,
    adzan: { umum: konten.adzan.umum?.url ?? null, subuh: konten.adzan.subuh?.url ?? null },
  };

  return <LayarTv data={data} />;
}
