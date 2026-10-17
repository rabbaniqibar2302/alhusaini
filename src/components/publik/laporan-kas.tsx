import { IkonGrafik } from "@/components/ikon";
import { formatRupiah, type RingkasanKas } from "@/lib/kas";
import { formatTanggal } from "@/lib/time";

function Angka({ nilai, tanda }: { nilai: number; tanda?: "masuk" | "keluar" }) {
  const warna = tanda === "masuk" ? "text-hijau-700" : tanda === "keluar" ? "text-red-700" : "text-stone-900";
  return (
    <span className={`font-semibold whitespace-nowrap tabular-nums ${warna}`}>
      {tanda === "masuk" ? "+" : tanda === "keluar" ? "−" : ""}
      {formatRupiah(nilai)}
    </span>
  );
}

export function LaporanKas({ ringkasan }: { ringkasan: RingkasanKas }) {
  const r = ringkasan;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section
        aria-label="Ringkasan kas"
        className="pola-islami overflow-hidden rounded-[1.75rem] bg-hijau-900 p-6 text-white shadow-sm"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-emas-300 uppercase">
          <IkonGrafik className="size-4" /> Saldo kas
        </p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums sm:text-4xl">{formatRupiah(r.saldoAkhir)}</p>
        {r.terakhir && (
          <p className="mt-1 text-sm text-hijau-100">Per {formatTanggal(r.terakhir, { hari: true })}</p>
        )}
        <dl className="mt-6 grid gap-3 rounded-2xl bg-white/10 p-4 text-sm ring-1 ring-white/10">
          <p className="text-xs font-semibold tracking-wider text-hijau-100 uppercase">Periode {r.periodeLabel}</p>
          <div className="flex justify-between gap-3">
            <dt className="text-hijau-50">Saldo awal periode</dt>
            <dd className="font-semibold tabular-nums">{formatRupiah(r.saldoAwal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-hijau-50">Pemasukan</dt>
            <dd className="font-semibold text-emerald-300 tabular-nums">+{formatRupiah(r.masuk)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-hijau-50">Pengeluaran</dt>
            <dd className="font-semibold text-red-300 tabular-nums">−{formatRupiah(r.keluar)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Rincian per bulan" className="space-y-3">
        {r.bulan.map((b, i) => (
          <details
            key={b.bulan}
            open={i === 0}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/80"
          >
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-stone-50">
              <span className="flex items-center gap-2 font-bold text-hijau-900">
                <span className="text-emas-600 transition group-open:rotate-90" aria-hidden="true">
                  ▸
                </span>
                {b.label}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                <Angka nilai={b.masuk} tanda="masuk" />
                <Angka nilai={b.keluar} tanda="keluar" />
              </span>
            </summary>
            <div className="border-t border-stone-100">
              {b.transaksi.length === 0 ? (
                <p className="px-4 py-4 text-sm text-stone-500">Belum ada transaksi di bulan ini.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Transaksi kas {b.label}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Keterangan</th>
                      <th scope="col">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {b.transaksi.map((t) => (
                      <tr key={t.id} className="align-top">
                        <td className="w-16 py-2.5 pl-4 text-xs whitespace-nowrap text-stone-500">
                          {formatTanggal(t.tanggal, { singkat: true }).replace(/ \d{4}$/, "")}
                        </td>
                        <td className="px-3 py-2.5 text-stone-800">{t.keterangan}</td>
                        <td className="py-2.5 pr-4 text-right">
                          <Angka nilai={t.jumlah} tanda={t.jenis} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="flex justify-between gap-3 bg-stone-50 px-4 py-2.5 text-sm">
                <span className="text-stone-600">Saldo akhir {b.label}</span>
                <Angka nilai={b.saldoAkhir} />
              </p>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
