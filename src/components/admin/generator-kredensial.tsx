"use client";

import { useState, type FormEvent } from "react";
import { IkonCentang, IkonGembok, IkonPeringatan } from "@/components/ikon";
import { Bidang, PesanHasil } from "./ui";

/**
 * Membuat isi environment variable admin LANGSUNG DI BROWSER:
 * hash bcrypt (cost 12), SESSION_SECRET acak, dan opsional secret TOTP + QR.
 * Password tidak pernah dikirim ke server dan tidak disimpan di mana pun.
 */

type HasilKredensial = {
  variabel: { nama: string; nilai: string; keterangan: string }[];
  totp: { secret: string; ukuranQr: number; modulQr: number[] } | null;
};

const POLA_USERNAME = /^[A-Za-z0-9._-]{3,32}$/;

function base64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function buatKredensial(username: string, password: string, pakaiTotp: boolean): Promise<HasilKredensial> {
  const { hash } = await import("bcryptjs");
  const hashPassword = await hash(password, 12);
  const sessionSecret = base64url(crypto.getRandomValues(new Uint8Array(48)));

  const variabel = [
    { nama: "ADMIN_USERNAME", nilai: username, keterangan: "Username untuk login" },
    { nama: "ADMIN_PASSWORD_HASH", nilai: hashPassword, keterangan: "Hash bcrypt dari password Anda" },
    { nama: "SESSION_SECRET", nilai: sessionSecret, keterangan: "Kunci rahasia acak untuk sesi login" },
  ];

  let totp: HasilKredensial["totp"] = null;
  if (pakaiTotp) {
    const OTPAuth = await import("otpauth");
    const QRCode = await import("qrcode");
    const secret = new OTPAuth.Secret({ size: 20 });
    const uri = new OTPAuth.TOTP({
      issuer: "Masjid Al Husaini",
      label: username,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    }).toString();
    const qr = QRCode.create(uri, { errorCorrectionLevel: "M" });
    totp = { secret: secret.base32, ukuranQr: qr.modules.size, modulQr: Array.from(qr.modules.data) };
    variabel.push({ nama: "ADMIN_TOTP_SECRET", nilai: secret.base32, keterangan: "Kunci verifikasi dua langkah" });
  }
  return { variabel, totp };
}

function TombolSalin({ teks, label = "Salin" }: { teks: string; label?: string }) {
  const [tersalin, setTersalin] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(teks);
          setTersalin(true);
          setTimeout(() => setTersalin(false), 2000);
        } catch {
          window.prompt("Salin teks berikut:", teks);
        }
      }}
      className="shrink-0 rounded-lg bg-hijau-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-hijau-700"
    >
      {tersalin ? "Tersalin ✓" : label}
    </button>
  );
}

function GambarQr({ ukuran, modul }: { ukuran: number; modul: number[] }) {
  const tepi = 4;
  let d = "";
  for (let y = 0; y < ukuran; y++) {
    for (let x = 0; x < ukuran; x++) {
      if (modul[y * ukuran + x]) d += `M${x + tepi} ${y + tepi}h1v1h-1z`;
    }
  }
  const total = ukuran + tepi * 2;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kode QR untuk aplikasi Google Authenticator"
      className="size-52 rounded-xl bg-white ring-1 ring-stone-200"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}

function UjiKodeTotp({ secret }: { secret: string }) {
  const [status, setStatus] = useState<boolean | null>(null);
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const kode = String(new FormData(e.currentTarget).get("kode") ?? "").trim();
        const OTPAuth = await import("otpauth");
        const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret), algorithm: "SHA1", digits: 6, period: 30 });
        setStatus(/^\d{6}$/.test(kode) && totp.validate({ token: kode, window: 1 }) !== null);
      }}
    >
      <div className="w-36">
        <Bidang label="Kode dari aplikasi" name="kode" inputMode="numeric" maxLength={6} placeholder="6 digit" autoComplete="off" />
      </div>
      <button
        type="submit"
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-hijau-900 ring-1 ring-stone-300 hover:bg-stone-50"
      >
        Uji kode
      </button>
      {status !== null && (
        <p className={`w-full text-sm ${status ? "text-hijau-700" : "text-red-700"}`}>
          {status
            ? "✓ Kode cocok — aplikasi authenticator sudah siap."
            : "✗ Kode tidak cocok. Pastikan QR yang dipindai benar dan jam ponsel otomatis."}
        </p>
      )}
    </form>
  );
}

export function GeneratorKredensial({ usernameAwal = "admin" }: { usernameAwal?: string }) {
  const [hasil, setHasil] = useState<HasilKredensial | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState<Record<string, string[]>>({});
  const [pesan, setPesan] = useState("");

  async function saatKirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (memproses) return;
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const ulang = String(fd.get("ulang") ?? "");
    const pakaiTotp = fd.get("totp") === "on";

    const g: Record<string, string[]> = {};
    if (!POLA_USERNAME.test(username)) g.username = ["3–32 karakter: huruf, angka, titik, strip, atau garis bawah"];
    if (password.length < 12) g.password = ["Password minimal 12 karakter"];
    else if (new TextEncoder().encode(password).length > 72) g.password = ["Password maksimal 72 byte (batas bcrypt)"];
    if (!g.password && ulang !== password) g.ulang = ["Password tidak sama"];
    setGalat(g);
    if (Object.keys(g).length > 0) {
      setPesan("Periksa kembali isian yang ditandai.");
      return;
    }

    setPesan("");
    setMemproses(true);
    try {
      setHasil(await buatKredensial(username, password, pakaiTotp));
    } catch {
      setPesan("Gagal membuat kredensial di browser ini. Coba browser lain (Chrome/Firefox/Safari terbaru).");
    } finally {
      setMemproses(false);
    }
  }

  if (hasil) {
    const semua = hasil.variabel.map((v) => `${v.nama}=${v.nilai}`).join("\n");
    return (
      <div className="space-y-5">
        <p className="flex items-start gap-2 rounded-xl bg-hijau-50 px-3 py-2.5 text-sm text-hijau-800 ring-1 ring-hijau-200">
          <IkonCentang className="mt-px size-4 shrink-0" />
          Kredensial berhasil dibuat di browser Anda. Ingat password Anda baik-baik — Vercel hanya menyimpan hash-nya,
          jadi password tidak bisa dilihat lagi.
        </p>

        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-700">
          <li>
            Buka <strong>Vercel → proyek Anda → Settings → Environment Variables</strong>.
          </li>
          <li>
            Tambahkan variabel di bawah ini (environment <strong>Production</strong>). Cara cepat: klik{" "}
            <strong>Salin semua</strong>, lalu tempel ke kolom <em>Key</em> — Vercel otomatis memecahnya menjadi
            beberapa variabel. Salin persis, tanpa tanda kutip.
          </li>
          <li>
            Buka tab <strong>Deployments</strong>, klik titik tiga pada deployment teratas, pilih{" "}
            <strong>Redeploy</strong>.
          </li>
          <li>
            Setelah selesai, buka <strong>/admin/login</strong> dan masuk dengan username &amp; password tadi.
          </li>
        </ol>

        <div className="space-y-3">
          {hasil.variabel.map((v) => (
            <div key={v.nama} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-200">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-hijau-900">{v.nama}</p>
                  <p className="text-xs text-stone-500">{v.keterangan}</p>
                </div>
                <TombolSalin teks={v.nilai} />
              </div>
              <code className="mt-2 block rounded-lg bg-white px-2.5 py-2 font-mono text-xs break-all text-stone-800 ring-1 ring-stone-200 select-all">
                {v.nilai}
              </code>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <TombolSalin teks={semua} label="Salin semua" />
            <span className="text-xs text-stone-500">Format KEY=nilai, satu per baris.</span>
          </div>
        </div>

        {hasil.totp && (
          <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <h3 className="font-semibold text-hijau-900">Verifikasi dua langkah (Google Authenticator)</h3>
            <p className="mt-1 text-sm text-stone-600">
              Pindai QR ini dengan aplikasi Google Authenticator (atau sejenisnya) di ponsel Anda, lalu uji kodenya.
              Setelah ADMIN_TOTP_SECRET dipasang, login meminta kode 6 digit dari aplikasi.
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
              <GambarQr ukuran={hasil.totp.ukuranQr} modul={hasil.totp.modulQr} />
              <div className="min-w-0 text-sm">
                <p className="text-stone-600">Tidak bisa memindai? Masukkan kunci ini secara manual:</p>
                <code className="mt-1 block font-mono text-sm break-all text-hijau-900 select-all">{hasil.totp.secret}</code>
                <UjiKodeTotp secret={hasil.totp.secret} />
              </div>
            </div>
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-stone-500">
          <IkonPeringatan className="mt-px size-4 shrink-0 text-emas-600" />
          Jangan bagikan nilai-nilai ini kepada siapa pun. Halaman ini tidak menyimpan apa pun; bila tertutup, cukup
          ulangi dari awal.
        </p>
        <button
          type="button"
          onClick={() => setHasil(null)}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
        >
          Ulangi dari awal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={saatKirim} className="space-y-4" noValidate>
      <Bidang
        label="Username admin"
        name="username"
        defaultValue={usernameAwal}
        required
        maxLength={32}
        autoCapitalize="none"
        autoComplete="username"
        spellCheck={false}
        galat={galat.username}
      />
      <Bidang
        label="Password baru"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        petunjuk="Minimal 12 karakter. Tips: gabungkan 3–4 kata acak dan angka yang mudah Anda ingat."
        galat={galat.password}
      />
      <Bidang label="Ulangi password" name="ulang" type="password" required autoComplete="new-password" galat={galat.ulang} />
      <label className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-3 text-sm ring-1 ring-stone-200">
        <input type="checkbox" name="totp" className="mt-0.5 size-4 accent-hijau-700" />
        <span>
          <span className="font-semibold text-stone-800">Aktifkan verifikasi dua langkah (disarankan)</span>
          <span className="block text-stone-600">
            Login juga meminta kode 6 digit dari aplikasi Google Authenticator di ponsel.
          </span>
        </span>
      </label>
      {pesan && <PesanHasil hasil={{ ok: false, pesan }} />}
      <button
        type="submit"
        disabled={memproses}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hijau-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-hijau-700 disabled:cursor-wait disabled:opacity-60"
      >
        {memproses ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        ) : (
          <IkonGembok className="size-4" />
        )}
        {memproses ? "Membuat hash… (beberapa detik)" : "Buat kredensial"}
      </button>
      <p className="text-center text-xs text-stone-500">
        Semua proses berjalan di browser Anda. Password tidak dikirim ke server.
      </p>
    </form>
  );
}
