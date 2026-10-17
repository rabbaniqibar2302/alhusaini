"use client";

import { useState } from "react";
import { IkonPensil, IkonSampah } from "@/components/ikon";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";
import { formatAngka, formatRupiah, labelBulan, ringkasanKas, urutkanTransaksi } from "@/lib/kas";
import { PILIHAN_PERIODE_KAS, type JenisTransaksi, type SetelanKas, type TransaksiKas } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import { hapusTransaksiKas, simpanSetelanKas, simpanTransaksiKas } from "@/server/aksi/kas";
import { Bidang, Centang, Kartu, PesanHasil, Pilihan, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

/* ------------------------------- Pengaturan ------------------------------- */

function FormSetelan({ setelan }: { setelan: SetelanKas }) {
  const form = useFormAksi(simpanSetelanKas, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Pilihan
          label="Periode laporan"
          name="periodeBulan"
          defaultValue={String(setelan.periodeBulan)}
          opsi={PILIHAN_PERIODE_KAS.map((n) => ({ nilai: String(n), label: n === 1 ? "Bulan berjalan saja" : `${n} bulan terakhir` }))}
          galat={galat.periodeBulan}
        />
        <Bidang
          label="Saldo awal (Rp)"
          name="saldoAwal"
          inputMode="numeric"
          defaultValue={formatAngka(setelan.saldoAwal)}
          petunjuk="Saldo kas sebelum transaksi pertama yang dicatat."
          galat={galat.saldoAwal}
        />
      </div>
      <div className="space-y-3">
        <Centang label="Tampilkan di website" name="tampilWebsite" defaultChecked={setelan.tampilWebsite} />
        <Centang label="Tampilkan di layar TV" name="tampilTv" defaultChecked={setelan.tampilTv} />
      </div>
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>Simpan pengaturan</TombolKirim>
    </form>
  );
}

/* ------------------------------- Transaksi ------------------------------- */

const PILIHAN_JENIS: [JenisTransaksi, string][] = [
  ["masuk", "Pemasukan"],
  ["keluar", "Pengeluaran"],
];

function FormTransaksi({
  item,
  hariIni,
  onSelesai,
  onBatal,
}: {
  item: TransaksiKas | null;
  hariIni: string;
  onSelesai: (h: HasilAksi) => void;
  onBatal: () => void;
}) {
  const [jenis, setJenis] = useState<JenisTransaksi>(item?.jenis ?? "masuk");
  const form = useFormAksi(simpanTransaksiKas, { onSelesai: (h) => h.ok && onSelesai(h) });
  const galat = form.hasil.galat ?? {};
  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700">Jenis</legend>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 ring-1 ring-stone-200">
          {PILIHAN_JENIS.map(([nilai, label]) => (
            <label
              key={nilai}
              className={`cursor-pointer rounded-lg px-2 py-2 text-center text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emas-400 ${
                jenis === nilai
                  ? nilai === "masuk"
                    ? "bg-hijau-700 text-white shadow-sm"
                    : "bg-red-600 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <input
                type="radio"
                name="jenis"
                value={nilai}
                checked={jenis === nilai}
                onChange={() => setJenis(nilai)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang
          label="Tanggal"
          name="tanggal"
          type="date"
          required
          max={hariIni}
          defaultValue={item?.tanggal ?? hariIni}
          galat={galat.tanggal}
        />
        <Bidang
          label="Jumlah (Rp)"
          name="jumlah"
          inputMode="numeric"
          required
          placeholder="mis. 1.250.000"
          defaultValue={item ? formatAngka(item.jumlah) : undefined}
          galat={galat.jumlah}
        />
      </div>
      <Bidang
        label="Keterangan"
        name="keterangan"
        required
        maxLength={120}
        placeholder={jenis === "masuk" ? "mis. Kotak infak Jumat" : "mis. Bayar listrik Oktober"}
        defaultValue={item?.keterangan}
        galat={galat.keterangan}
      />
      {!form.hasil.ok && <PesanHasil hasil={form.hasil} />}
      <div className="flex flex-wrap gap-2">
        <TombolKirim pending={form.pending}>{item ? "Simpan perubahan" : "Catat transaksi"}</TombolKirim>
        {item && (
          <button
            type="button"
            onClick={onBatal}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

function TombolHapus({ t }: { t: TransaksiKas }) {
  const form = useFormAksi(hapusTransaksiKas, {
    resetSaatSukses: false,
    konfirmasi: `Hapus transaksi "${t.keterangan}" (${formatRupiah(t.jumlah)})?`,
  });
  return (
    <form onSubmit={form.onSubmit}>
      <input type="hidden" name="id" value={t.id} />
      <button
        type="submit"
        disabled={form.pending}
        aria-label="Hapus transaksi"
        title="Hapus"
        className="rounded-lg p-1.5 text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        <IkonSampah className="size-3.5" />
      </button>
    </form>
  );
}

/* --------------------------------- Halaman --------------------------------- */

export function KelolaKas({
  transaksi,
  setelan,
  hariIni,
}: {
  transaksi: TransaksiKas[];
  setelan: SetelanKas;
  hariIni: string;
}) {
  const [sedangEdit, setSedangEdit] = useState<TransaksiKas | null>(null);
  const [putaran, setPutaran] = useState(0);
  const [pesan, setPesan] = useState<HasilAksi>(HASIL_AWAL);
  const r = ringkasanKas(transaksi, setelan, hariIni);

  // Seluruh transaksi per bulan (bukan hanya periode laporan), terbaru di atas.
  const perBulan = new Map<string, TransaksiKas[]>();
  for (const t of urutkanTransaksi(transaksi)) {
    const b = t.tanggal.slice(0, 7);
    perBulan.set(b, [...(perBulan.get(b) ?? []), t]);
  }

  const mulaiEdit = (t: TransaksiKas) => {
    setSedangEdit(t);
    setPesan(HASIL_AWAL);
    document.getElementById("form-kas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm text-stone-600">
          Periode laporan: <span className="font-semibold text-hijau-900">{r.periodeLabel}</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Saldo kas saat ini", formatRupiah(r.saldoAkhir), "text-hijau-900"],
            ["Saldo awal periode", formatRupiah(r.saldoAwal), "text-stone-900"],
            ["Pemasukan periode ini", `+${formatRupiah(r.masuk)}`, "text-hijau-700"],
            ["Pengeluaran periode ini", `−${formatRupiah(r.keluar)}`, "text-red-700"],
          ].map(([label, nilai, warna]) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
              <p className="text-xs text-stone-500">{label}</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${warna}`}>{nilai}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="space-y-6">
          <div id="form-kas" className="scroll-mt-24">
            <Kartu
              judul={sedangEdit ? "Ubah transaksi" : "Catat transaksi"}
              deskripsi="Pemasukan (infak, donasi) atau pengeluaran (listrik, kebersihan, kegiatan)."
            >
              {pesan.pesan && (
                <div className="mb-4">
                  <PesanHasil hasil={pesan} />
                </div>
              )}
              <FormTransaksi
                key={sedangEdit ? `edit-${sedangEdit.id}` : `baru-${putaran}`}
                item={sedangEdit}
                hariIni={hariIni}
                onSelesai={(h) => {
                  setSedangEdit(null);
                  setPutaran((p) => p + 1);
                  setPesan(h);
                }}
                onBatal={() => {
                  setSedangEdit(null);
                  setPesan(HASIL_AWAL);
                }}
              />
            </Kartu>
          </div>
          <Kartu judul="Pengaturan laporan" deskripsi="Berapa bulan yang ditampilkan, saldo awal, dan tempat laporan tampil.">
            <FormSetelan setelan={setelan} />
          </Kartu>
        </div>

        <Kartu judul={`Riwayat transaksi (${transaksi.length})`} deskripsi="Perubahan langsung tampil di website dan layar TV.">
          {perBulan.size === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
              Belum ada transaksi. Catat lewat form.
            </p>
          ) : (
            <div className="space-y-3">
              {[...perBulan].map(([bulan, daftar], i) => {
                const masuk = daftar.filter((t) => t.jenis === "masuk").reduce((a, t) => a + t.jumlah, 0);
                const keluar = daftar.filter((t) => t.jenis === "keluar").reduce((a, t) => a + t.jumlah, 0);
                return (
                  <details key={bulan} open={i === 0} className="group rounded-xl ring-1 ring-stone-200">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2.5 hover:bg-stone-50">
                      <span className="font-semibold text-hijau-900">
                        <span className="mr-1.5 inline-block text-emas-600 transition group-open:rotate-90">▸</span>
                        {labelBulan(bulan)} <span className="text-xs font-normal text-stone-500">({daftar.length})</span>
                      </span>
                      <span className="flex gap-3 text-xs font-semibold tabular-nums">
                        <span className="text-hijau-700">+{formatRupiah(masuk)}</span>
                        <span className="text-red-700">−{formatRupiah(keluar)}</span>
                      </span>
                    </summary>
                    <ul className="divide-y divide-stone-100 border-t border-stone-100">
                      {daftar.map((t) => (
                        <li
                          key={t.id}
                          className={`flex items-center gap-3 px-3 py-2 text-sm ${sedangEdit?.id === t.id ? "bg-emas-50" : ""}`}
                        >
                          <span className="w-14 shrink-0 text-xs text-stone-500">
                            {formatTanggal(t.tanggal, { singkat: true }).replace(/ \d{4}$/, "")}
                          </span>
                          <span className="min-w-0 flex-1 break-words text-stone-800">{t.keterangan}</span>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${t.jenis === "masuk" ? "text-hijau-700" : "text-red-700"}`}
                          >
                            {t.jenis === "masuk" ? "+" : "−"}
                            {formatRupiah(t.jumlah)}
                          </span>
                          <span className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => mulaiEdit(t)}
                              aria-label="Ubah transaksi"
                              title="Ubah"
                              className="rounded-lg p-1.5 text-hijau-800 ring-1 ring-hijau-200 hover:bg-hijau-50"
                            >
                              <IkonPensil className="size-3.5" />
                            </button>
                            <TombolHapus t={t} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          )}
        </Kartu>
      </div>
    </div>
  );
}
