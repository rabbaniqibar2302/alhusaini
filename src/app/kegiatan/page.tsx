import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { InfoKosong } from "@/components/publik/bagian";
import { DaftarKegiatan } from "@/components/publik/daftar-kegiatan";
import { FooterSitus } from "@/components/publik/footer-situs";
import { HeaderSitus } from "@/components/publik/header-situs";
import { JudulHalamanPublik } from "@/components/publik/judul-halaman-publik";
import { cuplikanSejarah } from "@/components/publik/sejarah";
import { namaDenganWilayah } from "@/lib/site";
import { tanggalWIB } from "@/lib/time";
import { bacaIdentitas } from "@/server/identitas";
import { bacaKontenPublik, bagianTambahan, kegiatanTampil } from "@/server/konten-publik";
import { TAG_KONTEN } from "@/server/store";

export async function generateMetadata(): Promise<Metadata> {
  const identitas = await bacaIdentitas();
  return {
    title: "Kegiatan Masjid",
    description: `Dokumentasi dan agenda kegiatan ${namaDenganWilayah(identitas)}.`,
  };
}

export default async function HalamanKegiatan() {
  "use cache";
  cacheTag(TAG_KONTEN);

  const hariIni = tanggalWIB();
  const { konten, gagal } = await bacaKontenPublik(hariIni);
  if (gagal) cacheLife("minutes");
  else cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const { identitas } = konten;
  const kegiatan = kegiatanTampil(konten.kegiatan, hariIni);
  const adaSejarah = cuplikanSejarah(konten.sejarah.narasi).paragraf.length > 0 || konten.sejarah.foto.length > 0;

  return (
    <>
      <HeaderSitus identitas={identitas} logo={konten.logo} ada={{ kegiatan: kegiatan.length > 0, sejarah: adaSejarah, ...bagianTambahan(konten, hariIni) }} />
      <main className="flex-1 bg-krem">
        <JudulHalamanPublik
          kicker="Kegiatan"
          judul="Kegiatan Masjid"
          subjudul={`Dokumentasi dan agenda kegiatan ${identitas.nama} bersama jamaah dan warga sekitar.`}
        />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          {gagal ? (
            <InfoKosong teks="Daftar kegiatan sedang tidak dapat dimuat. Silakan muat ulang beberapa saat lagi." />
          ) : kegiatan.length > 0 ? (
            <DaftarKegiatan items={kegiatan} lengkap />
          ) : (
            <InfoKosong teks="Belum ada kegiatan yang dipublikasikan." />
          )}
        </div>
      </main>
      <FooterSitus identitas={identitas} kontak={konten.kontak} tahun={Number(hariIni.slice(0, 4))} logo={konten.logo} />
    </>
  );
}
