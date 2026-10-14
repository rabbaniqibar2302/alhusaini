"use client";

import { useState } from "react";
import { IkonSampah } from "@/components/ikon";
import type { KunciAcara } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";
import { hapusPenetapan, simpanKoreksiHijriah, simpanPenetapan } from "@/server/aksi/hitung-mundur";
import { Bidang, PesanHasil, Pilihan, TombolKirim } from "./ui";
import { useFormAksi } from "./use-form-aksi";

export function FormPenetapan({
  acara,
  tahunPilihan,
  perkiraan,
  tersimpan,
}: {
  acara: { kunci: KunciAcara; label: string }[];
  tahunPilihan: number[];
  /** perkiraan[acara][tahun] = tanggal otomatis (YYYY-MM-DD) */
  perkiraan: Record<string, Record<string, string>>;
  /** penetapan yang sudah ada: tersimpan["acara-tahun"] */
  tersimpan: Record<string, { tanggal: string; catatan: string }>;
}) {
  const [pilihAcara, setPilihAcara] = useState<KunciAcara>(acara[0].kunci);
  const [pilihTahun, setPilihTahun] = useState(String(tahunPilihan[0]));
  const form = useFormAksi(simpanPenetapan, { resetSaatSukses: false });
  const galat = form.hasil.galat ?? {};
  const tanggalOtomatis = perkiraan[pilihAcara]?.[pilihTahun] ?? "";
  const sudahAda = tersimpan[`${pilihAcara}-${pilihTahun}`];

  return (
    <form onSubmit={form.onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Pilihan
          label="Acara"
          name="acara"
          value={pilihAcara}
          onChange={(e) => setPilihAcara(e.currentTarget.value as KunciAcara)}
          opsi={acara.map((a) => ({ nilai: a.kunci, label: a.label }))}
          galat={galat.acara}
        />
        <Pilihan
          label="Tahun Hijriah"
          name="tahunHijriah"
          value={pilihTahun}
          onChange={(e) => setPilihTahun(e.currentTarget.value)}
          opsi={tahunPilihan.map((t) => ({ nilai: String(t), label: `${t} H` }))}
          galat={galat.tahunHijriah}
        />
      </div>
      <Bidang
        key={`tanggal-${pilihAcara}-${pilihTahun}`}
        label="Tanggal Masehi yang ditetapkan"
        name="tanggal"
        type="date"
        required
        defaultValue={sudahAda?.tanggal ?? tanggalOtomatis}
        petunjuk={
          tanggalOtomatis
            ? `Perkiraan otomatis: ${formatTanggal(tanggalOtomatis, { hari: true })}${sudahAda ? " · sudah pernah ditetapkan" : ""}`
            : undefined
        }
        galat={galat.tanggal}
      />
      <Bidang
        key={`catatan-${pilihAcara}-${pilihTahun}`}
        label="Catatan (opsional)"
        name="catatan"
        maxLength={150}
        defaultValue={sudahAda?.catatan ?? ""}
        placeholder="mis. Keputusan Sidang Isbat Kemenag"
        galat={galat.catatan}
      />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending}>Simpan penetapan</TombolKirim>
    </form>
  );
}

export function FormKoreksi({ nilai }: { nilai: number }) {
  const form = useFormAksi(simpanKoreksiHijriah, { resetSaatSukses: false });
  return (
    <form onSubmit={form.onSubmit} className="space-y-3">
      <Pilihan
        label="Koreksi tanggal Hijriah"
        name="koreksiHijriah"
        defaultValue={String(nilai)}
        opsi={[
          { nilai: "-2", label: "−2 hari" },
          { nilai: "-1", label: "−1 hari" },
          { nilai: "0", label: "Tanpa koreksi (Umm al-Qura)" },
          { nilai: "1", label: "+1 hari (lebih lambat)" },
          { nilai: "2", label: "+2 hari" },
        ]}
      />
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending} varian="sekunder">
        Simpan koreksi
      </TombolKirim>
    </form>
  );
}

export function TombolHapusPenetapan({ acara, tahunHijriah, label }: { acara: KunciAcara; tahunHijriah: number; label: string }) {
  const form = useFormAksi(hapusPenetapan, {
    resetSaatSukses: false,
    konfirmasi: `Hapus penetapan ${label}? Tanggal kembali memakai perkiraan otomatis.`,
  });
  return (
    <form onSubmit={form.onSubmit}>
      <input type="hidden" name="acara" value={acara} />
      <input type="hidden" name="tahunHijriah" value={tahunHijriah} />
      <button
        type="submit"
        disabled={form.pending}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
      >
        <IkonSampah className="size-3.5" /> {form.pending ? "Menghapus…" : "Hapus"}
      </button>
      {!form.hasil.ok && form.hasil.pesan && <p className="mt-1 text-xs text-red-700">{form.hasil.pesan}</p>}
    </form>
  );
}
