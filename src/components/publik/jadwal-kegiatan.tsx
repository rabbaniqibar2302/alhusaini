import type { CSSProperties, ReactNode } from "react";
import { IkonBulan, IkonBulanSabit, IkonBuku, IkonJam, IkonMatahari, IkonMikrofon, IkonPin } from "@/components/ikon";
import { KartuPenceramah, waktuTanggal } from "@/components/kartu-penceramah";
import { INFO_KAJIAN, labelJamKajian, susunKajian, type JenisKajian } from "@/lib/kajian";
import { fotoUntuk, type PetaFotoPenceramah } from "@/lib/penceramah";
import { posterKajian, posterKhotib, posterSholatKhusus, tautanPoster, type KonteksPoster } from "@/lib/poster";
import type { KajianItem, KhotibItem, SholatKhususItem } from "@/lib/schemas";
import { INFO_SHOLAT_KHUSUS, labelSholatKhusus, type JenisSholatKhusus } from "@/lib/sholat-khusus";
import { CatatanContoh, InfoKosong } from "./bagian";
import { TombolPoster } from "./tombol-poster";

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

/** `urutan`: kartu dalam satu deret muncul bergantian saat digulir. */
function ItemDeret({ urutan, children }: { urutan: number; children: ReactNode }) {
  return (
    <li
      data-muncul
      style={{ "--urutan": urutan } as CSSProperties}
      className="w-[72%] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none"
    >
      {children}
    </li>
  );
}

/* ------------------------------ Khotib Jumat ------------------------------ */

const KHOTIB_TAMPIL = 4;

export function JadwalKhotib({
  items,
  hariIni,
  penceramah,
  poster,
}: {
  items: KhotibItem[];
  hariIni: string;
  penceramah: PetaFotoPenceramah;
  poster: KonteksPoster;
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
        {mendatang.map((x, i) => {
          const foto = fotoUntuk(penceramah, x.khotib);
          return (
            <ItemDeret key={x.id} urutan={i}>
              <KartuPenceramah
                nama={x.khotib}
                peran="Khotib"
                kategori={i === 0 ? "Jumat terdekat" : "Sholat Jumat"}
                ikonKategori={<IkonMikrofon className="size-3.5 shrink-0 text-aksen-300" />}
                foto={foto}
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
                aksi={x.contoh ? undefined : <TombolPoster poster={tautanPoster(posterKhotib(x, foto, poster))} />}
              />
            </ItemDeret>
          );
        })}
      </DeretKartu>
      {mendatang.some((x) => x.contoh) && <CatatanContoh />}
    </div>
  );
}

/* ---------------------- Sholat Ied & sholat gerhana ---------------------- */

const IKON_SHOLAT_KHUSUS: Record<JenisSholatKhusus, (p: { className?: string }) => ReactNode> = {
  idulFitri: IkonBulanSabit,
  idulAdha: IkonBulanSabit,
  gerhanaBulan: IkonBulan,
  gerhanaMatahari: IkonMatahari,
};

/** `items`: jadwal mendatang (sudah disaring & diurutkan, tanpa data contoh). */
export function JadwalSholatKhusus({
  items,
  hariIni,
  penceramah,
  poster,
}: {
  items: SholatKhususItem[];
  hariIni: string;
  penceramah: PetaFotoPenceramah;
  poster: KonteksPoster;
}) {
  return (
    <DeretKartu label="Jadwal sholat Ied dan gerhana">
      {items.map((x, i) => {
        const foto = fotoUntuk(penceramah, x.khotib);
        const Ikon = IKON_SHOLAT_KHUSUS[x.jenis];
        const ada = x.imam || x.lokasi || x.catatan;
        return (
          <ItemDeret key={x.id} urutan={i}>
            <KartuPenceramah
              nama={x.khotib}
              peran="Khotib"
              kategori={labelSholatKhusus(x)}
              ikonKategori={<Ikon className="size-3.5 shrink-0 text-aksen-300" />}
              foto={foto}
              waktu={waktuTanggal(x.tanggal)}
              hariIni={x.tanggal === hariIni}
              jam={`${x.jam} WIB`}
              materi={x.tema ? `“${x.tema}”` : INFO_SHOLAT_KHUSUS[x.jenis].nama}
              tambahan={
                ada ? (
                  <div className="space-y-0.5">
                    {x.imam && (
                      <p>
                        Imam: <span className="font-semibold text-stone-700">{x.imam}</span>
                      </p>
                    )}
                    {x.lokasi && (
                      <p className="flex items-start gap-1">
                        <IkonPin className="mt-px size-3.5 shrink-0 text-aksen-600" />
                        <span className="font-semibold text-stone-700">{x.lokasi}</span>
                      </p>
                    )}
                    {x.catatan && <p className="italic">{x.catatan}</p>}
                  </div>
                ) : undefined
              }
              aksi={<TombolPoster poster={tautanPoster(posterSholatKhusus(x, foto, poster))} />}
            />
          </ItemDeret>
        );
      })}
    </DeretKartu>
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
  poster,
}: {
  pengajianRabu: KajianItem[];
  kuliahSubuh: KajianItem[];
  pengajianIbu: KajianItem[];
  hariIni: string;
  penceramah: PetaFotoPenceramah;
  poster: KonteksPoster;
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
            <header data-muncul className="mb-4 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-utama-700 to-utama-950 text-aksen-300 shadow-md shadow-utama-950/20">
                <Ikon className="size-5" />
              </span>
              <div>
                <h3 id={`kajian-${jenis}`} className="text-lg font-bold text-utama-900">
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
                  {daftar.map((x, i) => {
                    const foto = fotoUntuk(penceramah, x.ustadz);
                    return (
                      <ItemDeret key={x.id} urutan={i}>
                        <KartuPenceramah
                          nama={x.ustadz}
                          peran="Pemateri"
                          kategori={info.singkat}
                          ikonKategori={<Ikon className="size-3.5 shrink-0 text-aksen-300" />}
                          foto={foto}
                          waktu={x.pola === "mingguan" ? { pola: "mingguan", hari: x.hari } : waktuTanggal(x.tanggal)}
                          hariIni={x.pola === "tanggal" && x.tanggal === hariIni}
                          jam={labelJamKajian(jenis, x)?.replace(/^Pukul /, "")}
                          materi={x.materi}
                          aksi={
                            x.contoh ? undefined : (
                              <TombolPoster poster={tautanPoster(posterKajian(jenis, x, foto, poster))} />
                            )
                          }
                        />
                      </ItemDeret>
                    );
                  })}
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
