import type { ReactNode } from "react";
import { IkonBuku, IkonJam, IkonMatahari, IkonPengguna } from "@/components/ikon";
import type { KhotibItem, KuliahSubuhItem, PengajianIbuItem, PengajianRabuItem } from "@/lib/schemas";
import { HARI_PEKAN, formatTanggal } from "@/lib/time";
import { CatatanContoh, InfoKosong } from "./bagian";

const urutanHari = (h: string) => HARI_PEKAN.indexOf(h as (typeof HARI_PEKAN)[number]);

/* ------------------------------ Khotib Jumat ------------------------------ */

export function TabelKhotib({ items, hariIni }: { items: KhotibItem[]; hariIni: string }) {
  const mendatang = items
    .filter((x) => x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, 8);

  if (mendatang.length === 0) {
    return <InfoKosong teks="Jadwal khotib Jumat berikutnya belum diumumkan." />;
  }

  const sel = "md:table-cell md:px-4 md:py-3.5 md:align-top";
  const label = "w-16 shrink-0 text-stone-500 md:hidden";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Jadwal khotib dan imam sholat Jumat</caption>
        <thead className="hidden bg-hijau-900 text-hijau-50 md:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Tanggal</th>
            <th scope="col" className="px-4 py-3 font-semibold">Khotib</th>
            <th scope="col" className="px-4 py-3 font-semibold">Imam</th>
            <th scope="col" className="px-4 py-3 font-semibold">Tema Khutbah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {mendatang.map((x, i) => (
            <tr key={x.id} className={`block space-y-1.5 p-4 md:table-row md:space-y-0 md:p-0 ${i === 0 ? "bg-emas-50/70" : ""}`}>
              <td className={`block ${sel}`}>
                <span className="font-semibold text-hijau-900">{formatTanggal(x.tanggal, { hari: true })}</span>
                {i === 0 && (
                  <span className="ml-2 inline-block rounded-full bg-emas-400 px-2 py-0.5 text-[0.7rem] font-semibold text-hijau-950 md:mt-1 md:ml-0 md:block md:w-fit">
                    {x.tanggal === hariIni ? "Hari ini" : "Jumat terdekat"}
                  </span>
                )}
              </td>
              <td className={`flex gap-2 ${sel}`}>
                <span className={label}>Khotib</span>
                <span className="font-medium text-stone-900">{x.khotib}</span>
              </td>
              <td className={`flex gap-2 ${sel}`}>
                <span className={label}>Imam</span>
                <span>{x.imam || "—"}</span>
              </td>
              <td className={`flex gap-2 ${sel}`}>
                <span className={label}>Tema</span>
                <span className="text-stone-700">{x.tema || "—"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mendatang.some((x) => x.contoh) && <CatatanContoh />}
    </div>
  );
}

/* --------------------------------- Kajian --------------------------------- */

function KartuKajian({
  judul,
  keterangan,
  ikon,
  kosong,
  contoh,
  children,
}: {
  judul: string;
  keterangan: string;
  ikon: ReactNode;
  kosong: boolean;
  contoh: boolean;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80">
      <header className="flex items-center gap-3 border-b border-stone-100 bg-hijau-50/60 px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hijau-900 text-emas-300">{ikon}</span>
        <div>
          <h3 className="font-bold text-hijau-900">{judul}</h3>
          <p className="text-xs text-stone-500">{keterangan}</p>
        </div>
      </header>
      {kosong ? (
        <p className="px-4 py-6 text-center text-sm text-stone-500">Belum ada jadwal yang diumumkan.</p>
      ) : (
        <ul className="flex-1 divide-y divide-stone-100">{children}</ul>
      )}
      {contoh && <CatatanContoh />}
    </article>
  );
}

function BarisKajian({ waktu, sub, nama, materi, sorot }: { waktu: string; sub?: string; nama: string; materi: string; sorot?: boolean }) {
  return (
    <li className={`px-4 py-3 ${sorot ? "bg-emas-50/70" : ""}`}>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-hijau-800">
        {waktu}
        {sub && <span className="text-xs font-medium text-stone-500">{sub}</span>}
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-stone-900">
        <IkonPengguna className="mt-0.5 size-4 shrink-0 text-emas-600" />
        {nama}
      </p>
      <p className="mt-0.5 flex items-start gap-1.5 text-sm text-stone-600">
        <IkonBuku className="mt-0.5 size-4 shrink-0 text-emas-600" />
        {materi}
      </p>
    </li>
  );
}

export function JadwalKajian({
  pengajianRabu,
  kuliahSubuh,
  pengajianIbu,
  hariIni,
}: {
  pengajianRabu: PengajianRabuItem[];
  kuliahSubuh: KuliahSubuhItem[];
  pengajianIbu: PengajianIbuItem[];
  hariIni: string;
}) {
  const rabu = pengajianRabu
    .filter((x) => x.tanggal >= hariIni)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam))
    .slice(0, 6);
  const subuh = [...kuliahSubuh].sort((a, b) => urutanHari(a.hari) - urutanHari(b.hari));
  const ibu = [...pengajianIbu].sort((a, b) => urutanHari(a.hari) - urutanHari(b.hari) || a.jam.localeCompare(b.jam));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <KartuKajian
        judul="Pengajian Rabu"
        keterangan="Kajian rutin setiap Rabu malam"
        ikon={<IkonBuku className="size-5" />}
        kosong={rabu.length === 0}
        contoh={rabu.some((x) => x.contoh)}
      >
        {rabu.map((x, i) => (
          <BarisKajian
            key={x.id}
            waktu={formatTanggal(x.tanggal, { hari: true })}
            sub={`Pukul ${x.jam} WIB`}
            nama={x.ustadz}
            materi={x.materi}
            sorot={i === 0}
          />
        ))}
      </KartuKajian>

      <KartuKajian
        judul="Kuliah Subuh"
        keterangan="Ba'da sholat Subuh berjamaah"
        ikon={<IkonMatahari className="size-5" />}
        kosong={subuh.length === 0}
        contoh={subuh.some((x) => x.contoh)}
      >
        {subuh.map((x) => (
          <BarisKajian key={x.id} waktu={`Setiap ${x.hari}`} nama={x.ustadz} materi={x.materi} />
        ))}
      </KartuKajian>

      <KartuKajian
        judul="Pengajian Kaum Ibu"
        keterangan="Majelis taklim muslimah"
        ikon={<IkonJam className="size-5" />}
        kosong={ibu.length === 0}
        contoh={ibu.some((x) => x.contoh)}
      >
        {ibu.map((x) => (
          <BarisKajian
            key={x.id}
            waktu={`Setiap ${x.hari}`}
            sub={`Pukul ${x.jam} WIB`}
            nama={x.ustadzah}
            materi={x.materi}
          />
        ))}
      </KartuKajian>
    </div>
  );
}
