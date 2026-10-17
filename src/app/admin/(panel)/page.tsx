import type { Metadata } from "next";
import Link from "next/link";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu, Lencana } from "@/components/admin/ui";
import { IkonCentang, IkonPeringatan } from "@/components/ikon";
import { ACARA, kejadianBerikutnya } from "@/lib/countdown";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { pengumumanAktif } from "@/lib/pengumuman";
import { KUNCI_ACARA } from "@/lib/schemas";
import { formatTanggal, selisihHari, tanggalWIB } from "@/lib/time";
import { totpAktif } from "@/server/auth/kredensial";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaSemuaKonten, redisTersedia } from "@/server/store";
import { blobTerkonfigurasi } from "@/server/unggah-foto";

export const metadata: Metadata = { title: "Dasbor" };
export const instant = false;

export default async function Dasbor() {
  const sesi = await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const konten = await bacaSemuaKonten(hariIni);

  const status = [
    {
      label: "Database (Upstash Redis)",
      ok: redisTersedia(),
      ket: redisTersedia() ? "Terhubung" : "Belum dikonfigurasi — perubahan tidak bisa disimpan",
    },
    {
      label: "Penyimpanan foto (Vercel Blob)",
      ok: blobTerkonfigurasi(),
      ket: blobTerkonfigurasi() ? "Terhubung" : "Belum dikonfigurasi — upload foto tidak bisa dipakai",
    },
    {
      label: "Verifikasi dua langkah (2FA)",
      ok: totpAktif(),
      ket: totpAktif() ? "Aktif" : "Belum aktif — sangat disarankan (lihat README)",
    },
  ];

  const mendatang = (items: { tanggal: string; pola?: string }[]) =>
    items.filter((x) => x.pola === "mingguan" || x.tanggal >= hariIni).length;
  const adaContoh = (items: { contoh?: boolean }[]) => items.some((x) => x.contoh);

  const ringkasan: { label: string; href: string; ket: string; contoh?: boolean }[] = [
    {
      label: "Pengumuman",
      href: "/admin/pengumuman",
      ket: `${pengumumanAktif(konten.pengumuman, hariIni).length} aktif`,
      contoh: adaContoh(konten.pengumuman),
    },
    {
      label: "Khotib Jumat",
      href: "/admin/khotib",
      ket: `${mendatang(konten.khotib)} jadwal mendatang`,
      contoh: adaContoh(konten.khotib),
    },
    {
      label: "Pengajian Rabu",
      href: "/admin/pengajian-rabu",
      ket: `${mendatang(konten.pengajianRabu)} jadwal mendatang/rutin`,
      contoh: adaContoh(konten.pengajianRabu),
    },
    {
      label: "Kuliah Subuh",
      href: "/admin/kuliah-subuh",
      ket: `${mendatang(konten.kuliahSubuh)} jadwal mendatang/rutin`,
      contoh: adaContoh(konten.kuliahSubuh),
    },
    {
      label: "Pengajian Ibu",
      href: "/admin/pengajian-ibu",
      ket: `${mendatang(konten.pengajianIbu)} jadwal mendatang/rutin`,
      contoh: adaContoh(konten.pengajianIbu),
    },
    { label: "Kegiatan Masjid", href: "/admin/kegiatan", ket: `${konten.kegiatan.length} kegiatan` },
    {
      label: "Sejarah Masjid",
      href: "/admin/sejarah",
      ket: `${konten.sejarah.narasi ? "Narasi terisi" : "Narasi belum diisi"} · ${konten.sejarah.foto.length} foto`,
    },
    {
      label: "Logo & Foto Masjid",
      href: "/admin/foto-masjid",
      ket: `${konten.logo ? "Logo terpasang" : "Belum ada logo"} · ${konten.hero ? "foto utama terpasang" : "belum ada foto utama"}`,
    },
    {
      label: "Galeri Ambulans",
      href: "/admin/galeri",
      ket: `${konten.galeri.length} foto`,
      contoh: adaContoh(konten.galeri),
    },
    { label: "Layar TV", href: "/admin/tv", ket: "Iqomah, tampilan, dan cara pasang di TV" },
  ];

  const khotibBerikut = [...konten.khotib]
    .filter((x) => x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0];

  return (
    <>
      <JudulHalaman
        judul={`Assalamu'alaikum, ${sesi.username}`}
        deskripsi={`${formatTanggal(hariIni, { hari: true })} · ${formatHijriah(keHijriah(hariIni, konten.countdown.koreksiHijriah))}`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu judul="Status sistem">
          <ul className="space-y-2.5">
            {status.map((s) => (
              <li key={s.label} className="flex items-start gap-2.5 text-sm">
                {s.ok ? (
                  <IkonCentang className="mt-px size-5 shrink-0 text-hijau-600" />
                ) : (
                  <IkonPeringatan className="mt-px size-5 shrink-0 text-emas-600" />
                )}
                <span>
                  <span className="block font-semibold text-stone-800">{s.label}</span>
                  <span className="text-stone-600">{s.ket}</span>
                </span>
              </li>
            ))}
          </ul>
        </Kartu>

        <Kartu judul="Sekilas">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-stone-500">Khotib Jumat terdekat</dt>
              <dd className="font-semibold text-hijau-900">
                {khotibBerikut ? `${formatTanggal(khotibBerikut.tanggal, { hari: true })} — ${khotibBerikut.khotib}` : "Belum dijadwalkan"}
              </dd>
            </div>
            {KUNCI_ACARA.map((a) => {
              const k = kejadianBerikutnya(a, hariIni, konten.countdown, 1)[0];
              return (
                <div key={a}>
                  <dt className="text-stone-500">{ACARA[a].judul}</dt>
                  <dd className="font-semibold text-hijau-900">
                    {k ? (
                      <>
                        {formatTanggal(k.tanggal, { hari: true })}{" "}
                        <span className="font-normal text-stone-500">
                          ({selisihHari(hariIni, k.tanggal)} hari lagi, {k.sumber === "penetapan" ? "ditetapkan" : "perkiraan"})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Kartu>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-hijau-900">Konten</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ringkasan.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:ring-hijau-300"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-hijau-900">{r.label}</span>
                {r.contoh && <Lencana>Masih data contoh</Lencana>}
              </span>
              <span className="mt-1 text-sm text-stone-600">{r.ket}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
