import type { Metadata } from "next";
import { FormKoreksi, FormPenetapan, TombolHapusPenetapan } from "@/components/admin/form-hitung-mundur";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu, Lencana } from "@/components/admin/ui";
import { ACARA, kejadianBerikutnya, tanggalPerkiraan } from "@/lib/countdown";
import { formatHijriah, keHijriah } from "@/lib/hijri";
import { KUNCI_ACARA } from "@/lib/schemas";
import { formatTanggal, tanggalWIB } from "@/lib/time";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Hitung Mundur" };
export const instant = false;

export default async function HalamanHitungMundur() {
  await wajibAdminHalaman();
  const hariIni = tanggalWIB();
  const setelan = await bacaKonten("countdown", hariIni);
  const tahunIni = keHijriah(hariIni, setelan.koreksiHijriah).tahun;
  const tahunPilihan = [tahunIni, tahunIni + 1];

  const perkiraan = Object.fromEntries(
    KUNCI_ACARA.map((a) => [
      a,
      Object.fromEntries(tahunPilihan.map((t) => [String(t), tanggalPerkiraan(a, t, setelan.koreksiHijriah)])),
    ]),
  );
  const penetapan = [...setelan.penetapan].sort(
    (a, b) => a.tahunHijriah - b.tahunHijriah || a.tanggal.localeCompare(b.tanggal),
  );

  return (
    <>
      <JudulHalaman
        judul="Hitung Mundur Hari Besar"
        deskripsi="Tanggal otomatis dihitung dari kalender Hijriah. Setelah sidang isbat Kemenag, tetapkan tanggal resminya di sini. Setelah tanggalnya lewat, hitung mundur otomatis pindah ke tahun Hijriah berikutnya."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {KUNCI_ACARA.map((a) => (
          <Kartu key={a} judul={ACARA[a].judul}>
            <ul className="space-y-3">
              {kejadianBerikutnya(a, hariIni, setelan, 2).map((k) => (
                <li key={k.tahunHijriah} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
                  <p className="text-xs font-semibold text-emas-700">
                    {ACARA[a].label} {k.tahunHijriah} H
                  </p>
                  <p className="font-semibold text-hijau-900">{formatTanggal(k.tanggal, { hari: true })}</p>
                  <p className="mt-1">
                    {k.sumber === "penetapan" ? (
                      <Lencana warna="hijau">Ditetapkan</Lencana>
                    ) : (
                      <Lencana warna="abu">Perkiraan otomatis</Lencana>
                    )}
                  </p>
                  {k.sumber === "penetapan" && k.otomatis !== k.tanggal && (
                    <p className="mt-1 text-xs text-stone-500">Perkiraan: {formatTanggal(k.otomatis)}</p>
                  )}
                </li>
              ))}
            </ul>
          </Kartu>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Kartu
          judul="Tetapkan tanggal resmi"
          deskripsi="Isi sesuai keputusan sidang isbat. Tanggal harus berada dalam 5 hari dari perkiraan tahun Hijriah yang dipilih."
        >
          <FormPenetapan
            acara={KUNCI_ACARA.map((k) => ({ kunci: k, label: ACARA[k].label }))}
            tahunPilihan={tahunPilihan}
            perkiraan={perkiraan}
            tersimpan={Object.fromEntries(
              setelan.penetapan.map((p) => [`${p.acara}-${p.tahunHijriah}`, { tanggal: p.tanggal, catatan: p.catatan }]),
            )}
          />
        </Kartu>

        <div className="space-y-6">
          <Kartu
            judul="Koreksi kalender Hijriah"
            deskripsi={
              <>
                Hari ini: <strong>{formatHijriah(keHijriah(hariIni, setelan.koreksiHijriah))}</strong>. Gunakan +1 bila
                kalender Indonesia biasanya 1 hari lebih lambat. Berlaku untuk tanggal Hijriah di halaman depan dan
                perkiraan otomatis.
              </>
            }
          >
            <FormKoreksi nilai={setelan.koreksiHijriah} />
          </Kartu>

          <Kartu judul={`Daftar penetapan (${penetapan.length})`}>
            {penetapan.length === 0 ? (
              <p className="text-sm text-stone-500">Belum ada penetapan; semua tanggal memakai perkiraan otomatis.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {penetapan.map((p) => {
                  const label = `${ACARA[p.acara].label} ${p.tahunHijriah} H`;
                  return (
                    <li key={`${p.acara}-${p.tahunHijriah}`} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-hijau-900">{label}</p>
                        <p className="text-stone-700">{formatTanggal(p.tanggal, { hari: true })}</p>
                        {p.catatan && <p className="text-xs break-words text-stone-500">{p.catatan}</p>}
                      </div>
                      <TombolHapusPenetapan acara={p.acara} tahunHijriah={p.tahunHijriah} label={label} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Kartu>
        </div>
      </div>
    </>
  );
}
