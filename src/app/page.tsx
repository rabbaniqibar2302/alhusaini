import { cacheLife, cacheTag } from "next/cache";
import { IkonAmbulans, IkonBulanSabit, IkonBuku, IkonInfo, IkonMikrofon, IkonPerisai, IkonWhatsApp } from "@/components/ikon";
import { Bagian, InfoKosong } from "@/components/publik/bagian";
import { FooterSitus } from "@/components/publik/footer-situs";
import { GaleriFoto } from "@/components/publik/galeri-foto";
import { HeaderSitus } from "@/components/publik/header-situs";
import { Hero } from "@/components/publik/hero";
import { HitungMundurHariBesar, type DataHariBesar } from "@/components/publik/hitung-mundur-hari-besar";
import { JadwalKajian, TabelKhotib } from "@/components/publik/jadwal-kegiatan";
import { JadwalSholatLangsung } from "@/components/publik/jadwal-sholat-langsung";
import { KartuLegalitas } from "@/components/publik/legalitas";
import { ACARA, kejadianBerikutnya } from "@/lib/countdown";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { tautanWhatsApp } from "@/lib/kontak";
import { KUNCI_ACARA } from "@/lib/schemas";
import { SITE } from "@/lib/site";
import { formatTanggal, tambahHari, tanggalWIB } from "@/lib/time";
import { getJadwalSholat } from "@/server/jadwal-sholat";
import { TAG_KONTEN, bacaSemuaKonten, kontenCadangan } from "@/server/store";

/**
 * Halaman depan disajikan dari cache (prerender) dan dibuat ulang:
 * - segera setelah admin menyimpan perubahan (updateTag "konten"),
 * - di latar belakang tiap 10 menit, dan paling lama 1 jam sekali.
 * Bagian yang bergantung pada jam (sholat berikutnya, hitung mundur) dihitung
 * di browser, jadi tetap akurat walau halaman berasal dari cache.
 */
export default async function Beranda() {
  "use cache";
  cacheTag(TAG_KONTEN);

  const hariIni = tanggalWIB();
  const besok = tambahHari(hariIni, 1);
  const [hasilKonten, sholatHariIni, sholatBesok] = await Promise.all([
    bacaSemuaKonten(hariIni).then(
      (konten) => ({ konten, gagal: false }),
      (err: unknown) => {
        console.error("[beranda] Gagal membaca database:", err);
        return { konten: kontenCadangan(hariIni), gagal: true };
      },
    ),
    getJadwalSholat(hariIni),
    getJadwalSholat(besok),
  ]);
  const { konten, gagal: databaseGagal } = hasilKonten;
  // Bila database sedang bermasalah, halaman cadangan hanya di-cache sebentar.
  if (databaseGagal) cacheLife("minutes");
  else cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const koreksi = konten.countdown.koreksiHijriah;
  const hijriah = {
    [hariIni]: formatHijriah(keHijriah(hariIni, koreksi)),
    [besok]: formatHijriah(keHijriah(besok, koreksi)),
  };

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

  const galeri = konten.galeri.map((g) => ({
    id: g.id,
    url: g.foto.url,
    lebar: g.foto.lebar,
    tinggi: g.foto.tinggi,
    alt: g.keterangan,
    keterangan: g.keterangan,
    tanggalTampil: g.tanggal ? formatTanggal(g.tanggal, { hari: true }) : undefined,
  }));

  return (
    <>
      <HeaderSitus />
      <main className="flex-1">
        {databaseGagal && (
          <p role="status" className="bg-emas-100 px-4 py-2 text-center text-sm text-emas-900">
            Sebagian informasi sedang tidak dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.
          </p>
        )}
        <Hero foto={konten.hero} />

        <section id="jadwal-sholat" aria-label="Jadwal sholat hari ini" className="bg-white">
          <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 pb-12 sm:-mt-12 sm:pb-16">
            <JadwalSholatLangsung hari={[sholatHariIni, sholatBesok]} hijriah={hijriah} />
          </div>
        </section>

        <Bagian
          id="hari-besar"
          latar="krem"
          kicker="Menyambut Hari Besar Islam"
          judul="Hitung Mundur Ramadhan & Hari Raya"
          subjudul="Tanggal mengikuti kalender Hijriah dan disesuaikan dengan keputusan sidang isbat Kementerian Agama RI."
          ikon={<IkonBulanSabit className="size-4" />}
        >
          <HitungMundurHariBesar acara={hariBesar} />
        </Bagian>

        <Bagian
          id="khotib"
          kicker="Sholat Jumat"
          judul="Jadwal Khotib Jumat"
          subjudul="Khotib, imam, dan tema khutbah sholat Jumat di Masjid Al Husaini."
          ikon={<IkonMikrofon className="size-4" />}
        >
          <TabelKhotib items={konten.khotib} hariIni={hariIni} />
        </Bagian>

        <Bagian
          id="kajian"
          latar="krem"
          kicker="Majelis Ilmu"
          judul="Jadwal Kajian Rutin"
          subjudul="Mari hadir dan ajak keluarga untuk menuntut ilmu bersama."
          ikon={<IkonBuku className="size-4" />}
        >
          <JadwalKajian
            pengajianRabu={konten.pengajianRabu}
            kuliahSubuh={konten.kuliahSubuh}
            pengajianIbu={konten.pengajianIbu}
            hariIni={hariIni}
          />
        </Bagian>

        <Bagian
          id="legalitas"
          kicker="Legalitas"
          judul="Masjid Terdaftar Resmi"
          subjudul={`${SITE.nama} terdaftar di Kementerian Agama RI dan Dewan Masjid Indonesia.`}
          ikon={<IkonPerisai className="size-4" />}
        >
          <KartuLegalitas data={konten.legalitas} />
        </Bagian>

        <Bagian
          id="ambulans"
          latar="krem"
          kicker="Layanan Umat"
          judul="Kegiatan Ambulans Masjid"
          subjudul="Dokumentasi layanan ambulans Masjid Al Husaini untuk membantu warga sekitar."
          ikon={<IkonAmbulans className="size-4" />}
        >
          {konten.kontak.whatsapp && (
            <a
              href={tautanWhatsApp(
                konten.kontak.whatsapp,
                `Assalamu'alaikum, saya ingin bertanya tentang layanan ambulans ${SITE.nama}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-hijau-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-hijau-700"
            >
              <IkonWhatsApp className="size-5" /> Hubungi layanan ambulans
            </a>
          )}
          {galeri.length > 0 ? (
            <>
              <GaleriFoto items={galeri} />
              {konten.galeri.some((g) => g.contoh) && (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-emas-700 italic">
                  <IkonInfo className="size-3.5" /> Gambar contoh — akan diganti dengan dokumentasi kegiatan asli.
                </p>
              )}
            </>
          ) : (
            <InfoKosong teks="Belum ada foto kegiatan ambulans." />
          )}
        </Bagian>
      </main>
      <FooterSitus kontak={konten.kontak} tahun={Number(hariIni.slice(0, 4))} />
    </>
  );
}
