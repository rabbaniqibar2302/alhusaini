import type { Metadata } from "next";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaPenceramah, type OrangPenceramah } from "@/components/admin/kelola-penceramah";
import { INFO_KAJIAN, JENIS_KAJIAN, kajianLewat } from "@/lib/kajian";
import { kunciNama } from "@/lib/penceramah";
import { tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Foto Penceramah" };
export const instant = false;

export default async function HalamanPenceramah() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const [penceramah, khotib, ...kajian] = await Promise.all([
    bacaKonten("penceramah", hariIni),
    bacaKonten("khotib", hariIni),
    ...JENIS_KAJIAN.map((j) => bacaKonten(j, hariIni)),
  ]);

  // Gabungkan penceramah yang sudah punya foto dengan nama di jadwal yang belum lewat.
  const peta = new Map<string, OrangPenceramah & { hitung: Map<string, number> }>();
  const ambil = (nama: string) => {
    const kunci = kunciNama(nama);
    let o = peta.get(kunci);
    if (!o) {
      o = { kunci, nama, id: null, foto: null, jadwal: [], hitung: new Map() };
      peta.set(kunci, o);
    }
    return o;
  };
  for (const p of penceramah) {
    Object.assign(ambil(p.nama), {
      nama: p.nama,
      id: p.id,
      foto: { url: p.foto.url, lebar: p.foto.lebar, tinggi: p.foto.tinggi, latarDihapus: p.latarDihapus },
    });
  }
  const catat = (nama: string, label: string) => {
    const o = ambil(nama);
    o.hitung.set(label, (o.hitung.get(label) ?? 0) + 1);
  };
  for (const x of khotib) if (!x.contoh && x.tanggal >= hariIni) catat(x.khotib, "Khotib Jumat");
  JENIS_KAJIAN.forEach((j, i) => {
    for (const x of kajian[i]) if (!x.contoh && !kajianLewat(x, hariIni)) catat(x.ustadz, INFO_KAJIAN[j].singkat);
  });

  const orang: OrangPenceramah[] = [...peta.values()]
    .map(({ hitung, ...o }) => ({ ...o, jadwal: [...hitung].map(([label, n]) => `${label} (${n})`) }))
    // Yang belum punya foto di atas supaya mudah dilengkapi.
    .sort((a, b) => Number(Boolean(a.foto)) - Number(Boolean(b.foto)) || a.nama.localeCompare(b.nama, "id"));

  return (
    <>
      <JudulHalaman
        judul="Foto Penceramah"
        deskripsi="Foto khotib dan ustadz/ustadzah untuk kartu jadwal di website dan layar TV."
      />
      <KelolaPenceramah orang={orang} />
    </>
  );
}
