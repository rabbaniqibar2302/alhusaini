import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { InfoKosong } from "@/components/publik/bagian";
import { FooterSitus } from "@/components/publik/footer-situs";
import { GaleriFoto } from "@/components/publik/galeri-foto";
import { HeaderSitus } from "@/components/publik/header-situs";
import { JudulHalamanPublik } from "@/components/publik/judul-halaman-publik";
import { NarasiSejarah, fotoSejarahTampil, paragrafSejarah } from "@/components/publik/sejarah";
import { alamatPendek, namaDenganWilayah } from "@/lib/site";
import { tanggalWIB } from "@/lib/time";
import { bacaIdentitas } from "@/server/identitas";
import { bacaKontenPublik } from "@/server/konten-publik";
import { TAG_KONTEN } from "@/server/store";

export async function generateMetadata(): Promise<Metadata> {
  const identitas = await bacaIdentitas();
  return {
    title: "Sejarah Masjid",
    description: `Sejarah berdirinya ${namaDenganWilayah(identitas)}.`,
  };
}

export default async function HalamanSejarah() {
  "use cache";
  cacheTag(TAG_KONTEN);

  const hariIni = tanggalWIB();
  const { konten, gagal } = await bacaKontenPublik(hariIni);
  if (gagal) cacheLife("minutes");
  else cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const { identitas } = konten;
  const paragraf = paragrafSejarah(konten.sejarah.narasi);
  const foto = fotoSejarahTampil(konten.sejarah.foto, identitas.nama);

  return (
    <>
      <HeaderSitus
        identitas={identitas}
        logo={konten.logo}
        ada={{ kegiatan: konten.kegiatan.length > 0, sejarah: paragraf.length > 0 || foto.length > 0 }}
      />
      <main className="flex-1 bg-white">
        <JudulHalamanPublik kicker="Sejarah" judul={`Sejarah ${identitas.nama}`} subjudul={alamatPendek(identitas)} />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          {paragraf.length === 0 && foto.length === 0 ? (
            <InfoKosong
              teks={gagal ? "Sejarah masjid sedang tidak dapat dimuat. Silakan muat ulang beberapa saat lagi." : "Sejarah masjid akan segera ditambahkan."}
            />
          ) : (
            <div className="space-y-10">
              {paragraf.length > 0 && (
                <article>
                  <NarasiSejarah paragraf={paragraf} className="max-w-3xl text-[1.05rem]" />
                </article>
              )}
              {foto.length > 0 && (
                <section aria-labelledby="judul-foto-sejarah">
                  <h2 id="judul-foto-sejarah" className="mb-4 text-xl font-bold text-hijau-900">
                    Dokumentasi Foto
                  </h2>
                  <GaleriFoto items={foto} />
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <FooterSitus identitas={identitas} kontak={konten.kontak} tahun={Number(hariIni.slice(0, 4))} logo={konten.logo} />
    </>
  );
}
