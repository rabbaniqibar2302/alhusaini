import { IkonDompet, IkonInfo, IkonQr } from "@/components/ikon";
import { nomorPolos } from "@/lib/infak";
import type { Infak } from "@/lib/schemas";
import { FotoDiperbesar } from "./galeri-foto";
import { TombolSalin } from "./tombol-salin";

export function InfoInfak({ infak, namaMasjid }: { infak: Infak; namaMasjid: string }) {
  const { qris, rekening } = infak;
  return (
    <div className={`grid items-start gap-5 ${qris && rekening.length > 0 ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "max-w-xl"}`}>
      {qris && (
        <section aria-label="QRIS" className="rounded-[1.75rem] bg-white p-5 text-center shadow-sm ring-1 ring-stone-200/80">
          <p className="flex items-center justify-center gap-2 text-sm font-bold tracking-wider text-hijau-900 uppercase">
            <IkonQr className="size-5 text-emas-600" /> Scan QRIS
          </p>
          {infak.namaQris && <p className="mt-0.5 text-sm text-stone-600">{infak.namaQris}</p>}
          <FotoDiperbesar
            item={{ id: "qris", url: qris.url, lebar: qris.lebar, tinggi: qris.tinggi, alt: `QRIS infak ${namaMasjid}`, keterangan: "QRIS infak" }}
            isi="contain"
            ikutiRasio
            sizes="(min-width: 768px) 360px, 80vw"
            className="mx-auto mt-4 w-full max-w-xs bg-white! ring-0!"
          />
          <p className="mt-3 text-xs text-stone-500">Bisa dibayar dengan aplikasi m-banking atau dompet digital apa pun.</p>
        </section>
      )}
      {rekening.length > 0 && (
        <section aria-label="Rekening infak" className="space-y-3">
          {rekening.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-emas-700 uppercase">
                <IkonDompet className="size-4" /> {r.bank}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl font-bold tracking-wide text-hijau-900 tabular-nums sm:text-2xl">{r.nomor}</p>
                <TombolSalin teks={nomorPolos(r.nomor)} label={`Salin nomor rekening ${r.bank}`} />
              </div>
              <p className="mt-0.5 text-sm text-stone-600">a.n. {r.atasNama}</p>
            </div>
          ))}
        </section>
      )}
      {infak.catatan && (
        <p className="flex items-start gap-2 text-sm text-stone-600 md:col-span-full">
          <IkonInfo className="mt-0.5 size-4 shrink-0 text-emas-600" /> {infak.catatan}
        </p>
      )}
    </div>
  );
}
