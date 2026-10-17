import type { Metadata } from "next";
import Image from "next/image";
import { FormInfak, FormQris, TombolHapusQris } from "@/components/admin/form-infak";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { Kartu } from "@/components/admin/ui";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Infak" };
export const instant = false;

export default async function HalamanInfak() {
  await wajibAdminHalaman();
  const infak = await bacaKonten("infak");
  return (
    <>
      <JudulHalaman
        judul="Informasi Infak"
        deskripsi="Rekening bank dan/atau QRIS untuk infak. Bila keduanya diisi, keduanya tampil bersamaan."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Kartu judul="Rekening & keterangan">
          <FormInfak infak={infak} />
        </Kartu>
        <div className="space-y-6">
          <Kartu judul="QRIS saat ini">
            {infak.qris ? (
              <>
                <div
                  className="relative mx-auto w-full max-w-60 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200"
                  style={{ aspectRatio: `${infak.qris.lebar} / ${infak.qris.tinggi}` }}
                >
                  <Image src={infak.qris.url} alt="QRIS saat ini" fill sizes="240px" className="object-contain" />
                </div>
                <div className="mt-3 flex justify-end">
                  <TombolHapusQris />
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
                Belum ada QRIS.
              </p>
            )}
          </Kartu>
          <Kartu judul={infak.qris ? "Ganti QRIS" : "Unggah QRIS"}>
            <FormQris />
          </Kartu>
        </div>
      </div>
    </>
  );
}
