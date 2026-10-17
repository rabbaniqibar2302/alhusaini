import type { ReactNode } from "react";
import { IkonBuku, IkonJam, IkonMatahari, IkonMikrofon } from "@/components/ikon";
import { KartuPenceramah, waktuTanggal } from "@/components/kartu-penceramah";
import { INFO_KAJIAN, labelJamKajian, susunKajian, type JenisKajian } from "@/lib/kajian";
import { fotoUntuk, type PetaFotoPenceramah } from "@/lib/penceramah";
import type { KajianItem, KhotibItem } from "@/lib/schemas";
import { CatatanContoh, InfoKosong } from "./bagian";

/** Di HP kartu bergeser ke samping; di layar lebar tersusun dalam grid. */
function DeretKartu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4"
    >
      {children}
    </ul>
  );
}

function ItemDeret({ children }: { children: ReactNode }) {
  return <li className="w-[72%] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none">{children}</li>;
}

/* ------------------------------ Khotib Jumat ------------------------------ */

const KHOTIB_TAMPIL = 4;

export function JadwalKhotib({
  items,
  hariIni,
  penceramah,
}: {
  items: KhotibItem[];
  hariIni: string;
  penceramah: PetaFotoPenceramah;
}) {
  const mendatang = items
    .filter((x) => x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, KHOTIB_TAMPIL);

  if (mendatang.length === 0) {
    return <InfoKosong teks="Jadwal khotib Jumat berikutnya belum diumumkan." />;
  }

  return (
    <div>
      <DeretKartu label="Jadwal khotib Jumat">
        {mendatang.map((x, i) => (
          <ItemDeret key={x.id}>
            <KartuPenceramah
              nama={x.khotib}
              peran="Khotib"
              kategori={i === 0 ? "Jumat terdekat" : "Sholat Jumat"}
              ikonKategori={<IkonMikrofon className="size-3.5 shrink-0 text-emas-300" />}
              foto={fotoUntuk(penceramah, x.khotib)}
              waktu={waktuTanggal(x.tanggal)}
              hariIni={x.tanggal === hariIni}
              materi={x.tema ? `“${x.tema}”` : undefined}
              tambahan={
                x.imam ? (
                  <>
                    Imam: <span className="font-semibold text-stone-700">{x.imam}</span>
                  </>
                ) : undefined
              }
            />
          </ItemDeret>
        ))}
      </DeretKartu>
      {mendatang.some((x) => x.contoh) && <CatatanContoh />}
    </div>
  );
}

/* --------------------------------- Kajian --------------------------------- */

const IKON_KAJIAN: Record<JenisKajian, (p: { className?: string }) => ReactNode> = {
  pengajianRabu: IkonBuku,
  kuliahSubuh: IkonMatahari,
  pengajianIbu: IkonJam,
};

export function JadwalKajian({
  pengajianRabu,
  kuliahSubuh,
  pengajianIbu,
  hariIni,
  penceramah,
}: {
  pengajianRabu: KajianItem[];
  kuliahSubuh: KajianItem[];
  pengajianIbu: KajianItem[];
  hariIni: string;
  penceramah: PetaFotoPenceramah;
}) {
  const kelompok: { jenis: JenisKajian; items: KajianItem[] }[] = [
    { jenis: "pengajianRabu", items: pengajianRabu },
    { jenis: "kuliahSubuh", items: kuliahSubuh },
    { jenis: "pengajianIbu", items: pengajianIbu },
  ];

  return (
    <div className="space-y-10">
      {kelompok.map(({ jenis, items }) => {
        const daftar = susunKajian(items, hariIni);
        const Ikon = IKON_KAJIAN[jenis];
        const info = INFO_KAJIAN[jenis];
        return (
          <section key={jenis} aria-labelledby={`kajian-${jenis}`}>
            <header className="mb-4 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hijau-900 text-emas-300">
                <Ikon className="size-5" />
              </span>
              <div>
                <h3 id={`kajian-${jenis}`} className="text-lg font-bold text-hijau-900">
                  {info.judul}
                </h3>
                <p className="text-sm text-stone-500">{info.keterangan}</p>
              </div>
            </header>
            {daftar.length === 0 ? (
              <InfoKosong teks="Belum ada jadwal yang diumumkan." />
            ) : (
              <>
                <DeretKartu label={`Jadwal ${info.judul}`}>
                  {daftar.map((x) => (
                    <ItemDeret key={x.id}>
                      <KartuPenceramah
                        nama={x.ustadz}
                        peran="Pemateri"
                        kategori={info.singkat}
                        ikonKategori={<Ikon className="size-3.5 shrink-0 text-emas-300" />}
                        foto={fotoUntuk(penceramah, x.ustadz)}
                        waktu={x.pola === "mingguan" ? { pola: "mingguan", hari: x.hari } : waktuTanggal(x.tanggal)}
                        hariIni={x.pola === "tanggal" && x.tanggal === hariIni}
                        jam={labelJamKajian(jenis, x)?.replace(/^Pukul /, "")}
                        materi={x.materi}
                      />
                    </ItemDeret>
                  ))}
                </DeretKartu>
                {daftar.some((x) => x.contoh) && <CatatanContoh />}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
