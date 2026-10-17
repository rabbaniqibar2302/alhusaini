import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  IkonAmbulans,
  IkonBuka,
  IkonBulanSabit,
  IkonBuku,
  IkonDompet,
  IkonGrafik,
  IkonInfo,
  IkonKalender,
  IkonMikrofon,
  IkonPengumuman,
  IkonPerisai,
  IkonSejarah,
  IkonWhatsApp,
} from "@/components/ikon";
import { Bagian, InfoKosong } from "@/components/publik/bagian";
import { DaftarAgenda } from "@/components/publik/agenda";
import { DaftarKegiatan } from "@/components/publik/daftar-kegiatan";
import { FooterSitus } from "@/components/publik/footer-situs";
import { GaleriFoto } from "@/components/publik/galeri-foto";
import { HeaderSitus } from "@/components/publik/header-situs";
import { Hero } from "@/components/publik/hero";
import { HitungMundurHariBesar, type DataHariBesar } from "@/components/publik/hitung-mundur-hari-besar";
import { InfoInfak } from "@/components/publik/infak";
import { JadwalKajian, JadwalKhotib } from "@/components/publik/jadwal-kegiatan";
import { JadwalSholatLangsung } from "@/components/publik/jadwal-sholat-langsung";
import { LaporanKas } from "@/components/publik/laporan-kas";
import { KartuLegalitas } from "@/components/publik/legalitas";
import { DaftarPengumuman } from "@/components/publik/pengumuman";
import { NarasiSejarah, cuplikanSejarah, fotoSejarahTampil } from "@/components/publik/sejarah";
import { agendaMendatang } from "@/lib/agenda";
import { ACARA, kejadianBerikutnya } from "@/lib/countdown";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { ringkasanKas } from "@/lib/kas";
import { tautanWhatsApp } from "@/lib/kontak";
import { petaFotoPenceramah } from "@/lib/penceramah";
import { pengumumanAktif } from "@/lib/pengumuman";
import { KUNCI_ACARA } from "@/lib/schemas";
import { formatTanggal, tambahHari, tanggalWIB } from "@/lib/time";
import { getJadwalSholat } from "@/server/jadwal-sholat";
import { bacaKontenPublik, bagianTambahan, kegiatanTampil } from "@/server/konten-publik";
import { TAG_KONTEN } from "@/server/store";

const KEGIATAN_DI_BERANDA = 6;
const AGENDA_DI_BERANDA = 6;

type IsiBagian = {
  id: string;
  kicker: string;
  judul: string;
  subjudul?: string;
  ikon: ReactNode;
  isi: ReactNode;
};

function TautanLanjut({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-6 inline-flex items-center gap-2 rounded-full bg-hijau-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-hijau-700"
    >
      {children} <IkonBuka className="size-4" />
    </Link>
  );
}

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
  const [{ konten, gagal: databaseGagal }, sholatHariIni, sholatBesok] = await Promise.all([
    bacaKontenPublik(hariIni),
    getJadwalSholat(hariIni),
    getJadwalSholat(besok),
  ]);
  // Bila database sedang bermasalah, halaman cadangan hanya di-cache sebentar.
  if (databaseGagal) cacheLife("minutes");
  else cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const { identitas } = konten;
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

  const fotoPenceramah = petaFotoPenceramah(konten.penceramah);
  const tambahan = bagianTambahan(konten, hariIni);
  const agenda = agendaMendatang(konten.agenda, hariIni).slice(0, AGENDA_DI_BERANDA);
  const kas = tambahan.kas ? ringkasanKas(konten.kas, konten.setelanKas, hariIni) : null;
  const pengumuman = pengumumanAktif(konten.pengumuman, hariIni).filter((x) => x.diWebsite);
  const kegiatan = kegiatanTampil(konten.kegiatan.slice(0, KEGIATAN_DI_BERANDA), hariIni);
  const sejarah = cuplikanSejarah(konten.sejarah.narasi);
  const fotoSejarah = fotoSejarahTampil(konten.sejarah.foto, identitas.nama);
  const adaSejarah = sejarah.paragraf.length > 0 || fotoSejarah.length > 0;

  const daftarBagian: (IsiBagian | false)[] = [
    pengumuman.length > 0 && {
      id: "pengumuman",
      kicker: "Info Masjid",
      judul: "Pengumuman",
      ikon: <IkonPengumuman className="size-4" />,
      isi: <DaftarPengumuman items={pengumuman} />,
    },
    agenda.length > 0 && {
      id: "agenda",
      kicker: "Agenda",
      judul: "Agenda Mendatang",
      subjudul: `Acara yang akan datang di ${identitas.nama}. Ketuk poster untuk memperbesar.`,
      ikon: <IkonKalender className="size-4" />,
      isi: <DaftarAgenda items={agenda} hariIni={hariIni} />,
    },
    {
      id: "hari-besar",
      kicker: "Menyambut Hari Besar Islam",
      judul: "Hitung Mundur Ramadhan & Hari Raya",
      subjudul: "Tanggal mengikuti kalender Hijriah dan disesuaikan dengan keputusan sidang isbat Kementerian Agama RI.",
      ikon: <IkonBulanSabit className="size-4" />,
      isi: <HitungMundurHariBesar acara={hariBesar} />,
    },
    {
      id: "khotib",
      kicker: "Sholat Jumat",
      judul: "Jadwal Khotib Jumat",
      subjudul: `Khotib, imam, dan tema khutbah sholat Jumat di ${identitas.nama}.`,
      ikon: <IkonMikrofon className="size-4" />,
      isi: <JadwalKhotib items={konten.khotib} hariIni={hariIni} penceramah={fotoPenceramah} />,
    },
    {
      id: "kajian",
      kicker: "Majelis Ilmu",
      judul: "Jadwal Kajian",
      subjudul: "Mari hadir dan ajak keluarga untuk menuntut ilmu bersama.",
      ikon: <IkonBuku className="size-4" />,
      isi: (
        <JadwalKajian
          pengajianRabu={konten.pengajianRabu}
          kuliahSubuh={konten.kuliahSubuh}
          pengajianIbu={konten.pengajianIbu}
          hariIni={hariIni}
          penceramah={fotoPenceramah}
        />
      ),
    },
    kegiatan.length > 0 && {
      id: "kegiatan",
      kicker: "Kegiatan",
      judul: "Kegiatan Masjid",
      subjudul: `Dokumentasi dan agenda kegiatan ${identitas.nama} bersama jamaah dan warga sekitar.`,
      ikon: <IkonKalender className="size-4" />,
      isi: (
        <>
          <DaftarKegiatan items={kegiatan} />
          <TautanLanjut href="/kegiatan">
            {konten.kegiatan.length > KEGIATAN_DI_BERANDA
              ? `Lihat semua kegiatan (${konten.kegiatan.length})`
              : "Lihat detail kegiatan"}
          </TautanLanjut>
        </>
      ),
    },
    tambahan.infak && {
      id: "infak",
      kicker: "Infak & Sedekah",
      judul: "Salurkan Infak Anda",
      subjudul: `Infak untuk kemakmuran ${identitas.nama} dapat disalurkan melalui QRIS atau transfer ke rekening berikut.`,
      ikon: <IkonDompet className="size-4" />,
      isi: <InfoInfak infak={konten.infak} namaMasjid={identitas.nama} />,
    },
    kas !== null && {
      id: "kas",
      kicker: "Transparansi",
      judul: "Laporan Kas Masjid",
      subjudul: `Pemasukan dan pengeluaran kas ${identitas.nama} periode ${kas.periodeLabel}.`,
      ikon: <IkonGrafik className="size-4" />,
      isi: <LaporanKas ringkasan={kas} />,
    },
    {
      id: "ambulans",
      kicker: "Layanan Umat",
      judul: "Kegiatan Ambulans Masjid",
      subjudul: `Dokumentasi layanan ambulans ${identitas.nama} untuk membantu warga sekitar.`,
      ikon: <IkonAmbulans className="size-4" />,
      isi: (
        <>
          {konten.kontak.whatsapp && (
            <a
              href={tautanWhatsApp(
                konten.kontak.whatsapp,
                `Assalamu'alaikum, saya ingin bertanya tentang layanan ambulans ${identitas.nama}.`,
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
        </>
      ),
    },
    adaSejarah && {
      id: "sejarah",
      kicker: "Sejarah",
      judul: `Sejarah ${identitas.nama}`,
      ikon: <IkonSejarah className="size-4" />,
      isi: (
        <div className={`grid gap-8 ${fotoSejarah.length > 0 && sejarah.paragraf.length > 0 ? "lg:grid-cols-[1.15fr_1fr]" : ""}`}>
          {sejarah.paragraf.length > 0 && (
            <div>
              <NarasiSejarah paragraf={sejarah.paragraf} className="max-w-3xl" />
              {(sejarah.terpotong || fotoSejarah.length > 4) && (
                <TautanLanjut href="/sejarah">Baca sejarah lengkap</TautanLanjut>
              )}
            </div>
          )}
          {fotoSejarah.length > 0 && (
            <div>
              <GaleriFoto
                items={fotoSejarah.slice(0, sejarah.paragraf.length > 0 ? 4 : 8)}
                kolom={sejarah.paragraf.length > 0 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}
              />
              {sejarah.paragraf.length === 0 && fotoSejarah.length > 8 && (
                <TautanLanjut href="/sejarah">Lihat semua foto sejarah</TautanLanjut>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "legalitas",
      kicker: "Legalitas",
      judul: "Masjid Terdaftar Resmi",
      subjudul: `${identitas.nama} terdaftar di Kementerian Agama RI dan Dewan Masjid Indonesia.`,
      ikon: <IkonPerisai className="size-4" />,
      isi: <KartuLegalitas data={konten.legalitas} />,
    },
  ];
  const bagian = daftarBagian.filter((b): b is IsiBagian => Boolean(b));

  return (
    <>
      <HeaderSitus identitas={identitas} logo={konten.logo} ada={{ kegiatan: kegiatan.length > 0, sejarah: adaSejarah, ...tambahan }} />
      <main className="flex-1">
        {databaseGagal && (
          <p role="status" className="bg-emas-100 px-4 py-2 text-center text-sm text-emas-900">
            Sebagian informasi sedang tidak dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.
          </p>
        )}
        <Hero foto={konten.hero} identitas={identitas} />

        <section id="jadwal-sholat" aria-label="Jadwal sholat hari ini" className="bg-white">
          <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 pb-12 sm:-mt-12 sm:pb-16">
            <JadwalSholatLangsung hari={[sholatHariIni, sholatBesok]} hijriah={hijriah} />
          </div>
        </section>

        {bagian.map((b, i) => (
          <Bagian
            key={b.id}
            id={b.id}
            latar={i % 2 === 0 ? "krem" : "putih"}
            kicker={b.kicker}
            judul={b.judul}
            subjudul={b.subjudul}
            ikon={b.ikon}
          >
            {b.isi}
          </Bagian>
        ))}
      </main>
      <FooterSitus identitas={identitas} kontak={konten.kontak} tahun={Number(hariIni.slice(0, 4))} logo={konten.logo} />
    </>
  );
}
