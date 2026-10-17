import type { Metadata } from "next";
import { headers } from "next/headers";
import { FormPengaturanTv } from "@/components/admin/form-tv";
import { JudulHalaman } from "@/components/admin/judul-halaman";
import { KelolaAdzan } from "@/components/admin/kelola-adzan";
import { Kartu } from "@/components/admin/ui";
import { IkonTautanLuar, IkonTv } from "@/components/ikon";
import { wajibAdminHalaman } from "@/server/auth/penjaga";
import { bacaKonten } from "@/server/store";

export const metadata: Metadata = { title: "Layar TV" };

export default async function Halaman() {
  await wajibAdminHalaman();
  const [setelan, adzan] = await Promise.all([bacaKonten("tv"), bacaKonten("adzan")]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "alamat-website-anda";
  const alamatTv = `${host.startsWith("localhost") ? "http" : "https"}://${host}/tv`;
  return (
    <>
      <JudulHalaman
        judul="Layar TV Masjid"
        deskripsi="Tampilan khusus TV di dalam masjid: jam, jadwal sholat, hitung mundur adzan & iqomah, pengumuman, kajian, dan foto."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Kartu judul="Pengaturan">
            <FormPengaturanTv setelan={setelan} />
          </Kartu>
          <Kartu
            judul="Suara adzan"
            deskripsi="Diputar di layar TV tepat saat masuk waktu sholat, lalu berhenti saat sholat dimulai."
          >
            <KelolaAdzan adzan={adzan} />
          </Kartu>
        </div>
        <Kartu judul="Cara memasang di TV">
          <a
            href="/tv"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-xl bg-hijau-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hijau-700"
          >
            <IkonTv className="size-4" /> Buka layar TV <IkonTautanLuar className="size-4" />
          </a>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-stone-700">
            <li>
              Hubungkan TV ke internet lewat Android TV / TV box, mini PC, atau laptop, lalu buka browser Chrome
              (versi terbaru).
            </li>
            <li>
              Buka alamat <span className="font-mono font-semibold break-all">{alamatTv}</span>
            </li>
            <li>
              Tekan tombol <span className="font-semibold">Layar penuh</span> di pojok kanan atas (muncul saat mouse
              digerakkan), atau tekan tombol F11 / huruf F pada keyboard.
            </li>
            <li>Matikan mode tidur/screensaver TV box supaya layar tetap menyala.</li>
            <li>
              <span className="font-semibold">Supaya suara adzan berbunyi:</span> setelah layar TV dibuka, klik layar
              atau tekan tombol OK pada remote (Enter pada keyboard) sekali. Browser memang tidak mengizinkan suara
              sebelum ada sentuhan dari pengguna; selama belum diizinkan, layar menampilkan pengingat. Ulangi bila TV
              box dinyalakan ulang.
            </li>
          </ol>
          <p className="mt-4 rounded-xl bg-emas-50 px-3 py-2.5 text-xs text-emas-900 ring-1 ring-emas-200">
            Tips TV box Android: aplikasi browser kios seperti <span className="font-semibold">Fully Kiosk Browser</span>{" "}
            bisa diatur agar suara langsung boleh berbunyi (opsi autoplay) dan membuka layar TV otomatis saat TV box
            menyala.
          </p>
          <p className="mt-4 rounded-xl bg-hijau-50 px-3 py-2.5 text-xs text-hijau-800 ring-1 ring-hijau-100">
            Layar TV memperbarui datanya sendiri setiap 5 menit dan menyesuaikan jam dengan server, jadi tidak perlu
            dimuat ulang setelah admin mengubah jadwal atau pengumuman.
          </p>
        </Kartu>
      </div>
    </>
  );
}
