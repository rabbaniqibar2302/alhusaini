import Link from "next/link";
import { LogoMasjid, type LogoTampil } from "@/components/logo-masjid";
import { tautanWhatsApp } from "@/lib/kontak";
import type { Identitas, Kontak } from "@/lib/schemas";
import { urlMaps } from "@/lib/site";
import type { JadwalHarian } from "@/lib/tipe-jadwal-sholat";
import { NavDesktop, NavigasiBawah, type AksiCepat, type TautanNav } from "./navigasi-situs";
import { PenggerakAnimasi } from "./penggerak-animasi";

export type BagianOpsional = {
  /** Label menu, mis. "Sholat Ied"; null/kosong bila tidak ada jadwal. */
  sholatKhusus?: string | null;
  kegiatan?: boolean;
  sejarah?: boolean;
  agenda?: boolean;
  infak?: boolean;
  kas?: boolean;
};

/** Bagian halaman depan yang tampil, berurutan seperti di halaman. */
function daftarBagian(ada: BagianOpsional): TautanNav[] {
  const daftar: [TautanNav, boolean?][] = [
    [{ id: "jadwal-sholat", label: "Jadwal Sholat", ikon: "sholat" }],
    [{ id: "sholat-khusus", label: ada.sholatKhusus ?? "", ikon: "sholatKhusus" }, Boolean(ada.sholatKhusus)],
    [{ id: "agenda", label: "Agenda", ikon: "agenda" }, ada.agenda === true],
    [{ id: "hari-besar", label: "Hari Besar", ikon: "hariBesar" }],
    [{ id: "khotib", label: "Khotib Jumat", ikon: "khotib" }],
    [{ id: "kajian", label: "Kajian", ikon: "kajian" }],
    [{ id: "kegiatan", label: "Kegiatan", ikon: "kegiatan" }, ada.kegiatan],
    [{ id: "infak", label: "Infak", ikon: "infak" }, ada.infak === true],
    [{ id: "kas", label: "Laporan Kas", ikon: "kas" }, ada.kas === true],
    [{ id: "ambulans", label: "Ambulans", ikon: "ambulans" }],
    [{ id: "sejarah", label: "Sejarah", ikon: "sejarah" }, ada.sejarah],
    [{ id: "legalitas", label: "Legalitas", ikon: "legalitas" }],
    [{ id: "kontak", label: "Kontak", ikon: "kontak" }],
  ];
  return daftar.filter(([, tampil]) => tampil !== false).map(([t]) => t);
}

/** Tab kanan navigasi HP: yang paling sering dicari setelah jadwal. */
function tabKanan(bagian: TautanNav[]): TautanNav {
  for (const id of ["infak", "agenda", "kegiatan"]) {
    const t = bagian.find((b) => b.id === id);
    if (t) return t;
  }
  return { id: "kontak", label: "Kontak", ikon: "kontak" };
}

function aksiCepat(identitas: Pick<Identitas, "nama" | "alamat" | "alamatSingkat">, kontak: Kontak | undefined): AksiCepat[] {
  const aksi: AksiCepat[] = [];
  if (kontak?.whatsapp) aksi.push({ label: "WhatsApp", href: tautanWhatsApp(kontak.whatsapp), ikon: "whatsapp" });
  if (kontak?.telepon) aksi.push({ label: "Telepon", href: `tel:${kontak.telepon.replace(/[^0-9+]/g, "")}`, ikon: "telepon" });
  aksi.push({ label: "Petunjuk arah", href: urlMaps(identitas), ikon: "peta" });
  return aksi;
}

/**
 * Header situs publik. Layar lebar: nama masjid + menu bagian (menandai bagian
 * yang sedang dibaca). HP: header ringkas di atas, navigasi di bawah layar.
 */
export function HeaderSitus({
  identitas,
  logo,
  ada = {},
  kontak,
  jadwal = null,
  aktifTetap,
}: {
  identitas: Pick<Identitas, "nama" | "wilayah" | "alamat" | "alamatSingkat">;
  logo: LogoTampil | null;
  ada?: BagianOpsional;
  kontak?: Kontak;
  /** Jadwal sholat hari ini & besok, untuk tombol sholat di navigasi HP. */
  jadwal?: JadwalHarian[] | null;
  /** Halaman selain beranda yang mewakili satu bagian, mis. "kegiatan". */
  aktifTetap?: string;
}) {
  const bagian = daftarBagian(ada);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-utama-950/95 text-white backdrop-blur-xl supports-[backdrop-filter]:bg-utama-950/90">
        <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-6 px-4 lg:h-16">
          <Link href="/#beranda" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <LogoMasjid logo={logo} nama={identitas.nama} priority />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-bold">{identitas.nama}</span>
              {identitas.wilayah && <span className="block truncate text-xs text-utama-100">{identitas.wilayah}</span>}
            </span>
          </Link>
          <NavDesktop tautan={bagian} />
        </div>
      </header>
      <NavigasiBawah
        tab={[{ id: "beranda", label: "Beranda", ikon: "beranda" }, { id: "kajian", label: "Kajian", ikon: "kajian" }, tabKanan(bagian)]}
        menu={bagian}
        aksi={aksiCepat(identitas, kontak)}
        nama={identitas.nama}
        logo={logo}
        jadwal={jadwal}
        aktifTetap={aktifTetap}
      />
      <PenggerakAnimasi />
    </>
  );
}
