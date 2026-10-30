/* eslint-disable @next/next/no-img-element -- Satori (next/og) hanya mengenal <img> biasa, bukan next/image. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { CSSProperties, ReactNode, SVGProps } from "react";
import sharp from "sharp";
import {
  IkonBuku,
  IkonJam,
  IkonKalender,
  IkonMasjid,
  IkonMatahari,
  IkonMikrofon,
  IkonPin,
} from "@/components/ikon";
import { inisialNama } from "@/lib/penceramah";
import {
  UKURAN_POSTER,
  teksAmanPoster,
  type BarisPoster,
  type IsiPoster,
  type JenisPoster,
  type PengisiPoster,
} from "@/lib/poster";
import { NAMA_BULAN, namaHari } from "@/lib/time";

/**
 * Menggambar poster story (1080×1920) dengan next/og (Satori): hanya flexbox
 * dan sebagian CSS yang didukung, jadi setiap <div> berisi lebih dari satu
 * anak wajib `display: flex`. Foto diolah dulu dengan sharp (diperkecil,
 * sudut dibulatkan) lalu disisipkan sebagai data URI. Hasil akhirnya JPEG
 * supaya ringan diunduh dari HP.
 */

const WARNA = {
  hijau950: "#072219",
  hijau900: "#0f3b2c",
  hijau700: "#165a41",
  emas200: "#efd98e",
  emas300: "#e6c155",
  emas600: "#a26e18",
} as const;

const SISI = 80;

// Pola bintang delapan yang sama dengan website (utilitas pola-islami), diperbesar.
const POLA = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'><g fill='none' stroke='#dcaa31' stroke-opacity='0.13' stroke-width='1'><path d='M28 4l7 17 17 7-17 7-7 17-7-17-17-7 17-7z'/><path d='M28 12l11.3 4.7L44 28l-4.7 11.3L28 44l-11.3-4.7L12 28l4.7-11.3z'/></g></svg>",
)}")`;

/* -------------------------------- Font -------------------------------- */

const FOLDER_FONT = join(process.cwd(), "src/server/poster/font");
const BERAT_FONT = [500, 700, 800] as const;

type FontPoster = { name: string; data: ArrayBuffer; weight: (typeof BERAT_FONT)[number]; style: "normal" };

let fontPoster: Promise<FontPoster[]> | undefined;

function muatFont(): Promise<FontPoster[]> {
  fontPoster ??= Promise.all(
    BERAT_FONT.map(async (weight) => {
      const b = await readFile(join(FOLDER_FONT, `PlusJakartaSans-${weight}.ttf`));
      const data = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
      return { name: "Jakarta", data, weight, style: "normal" as const };
    }),
  ).catch((err: unknown) => {
    fontPoster = undefined;
    throw err;
  });
  return fontPoster;
}

/* ------------------------------- Gambar ------------------------------- */

/** Gambar di tengah poster, sebagai data URI. */
type GambarPanggung = { jenis: "potongan" | "bingkai" | "poster"; uri: string } | null;

const uriPng = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

/** Foto unggahan (Vercel Blob; URL sudah divalidasi skema). null bila berkasnya sudah tidak ada. */
async function ambilGambar(url: string): Promise<Buffer | null> {
  // Gambar contoh bawaan (/images/...) tidak pernah dibuatkan poster.
  if (!url.startsWith("https://")) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gagal mengambil gambar (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Foto tanpa latar dipakai apa adanya (transparan), hanya diperkecil. */
async function siapkanPotongan(b: Buffer): Promise<string> {
  const png = await sharp(b)
    .resize({ width: UKURAN_POSTER.lebar, height: 1200, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return uriPng(png);
}

/** Foto/poster dengan sudut membulat dan garis tepi, transparan di luar sudut. */
async function siapkanBingkai(
  b: Buffer,
  ukuran: { lebar: number; tinggi: number; muat: "cover" | "inside" },
  gaya: { radius: number; tepi: number; warna: string },
): Promise<string> {
  const { data, info } = await sharp(b)
    .rotate()
    .resize({ width: ukuran.lebar, height: ukuran.tinggi, fit: ukuran.muat, position: "north" })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width: l, height: t } = info;
  const { radius: r, tepi } = gaya;
  const topeng = `<svg width="${l}" height="${t}"><rect width="${l}" height="${t}" rx="${r}" fill="#fff"/></svg>`;
  const garis = `<svg width="${l}" height="${t}"><rect x="${tepi / 2}" y="${tepi / 2}" width="${l - tepi}" height="${t - tepi}" rx="${r - tepi / 2}" fill="none" stroke="${gaya.warna}" stroke-width="${tepi}"/></svg>`;
  const hasil = await sharp(data)
    .composite([
      { input: Buffer.from(topeng), blend: "dest-in" },
      { input: Buffer.from(garis), blend: "over" },
    ])
    .png()
    .toBuffer();
  return uriPng(hasil);
}

async function siapkanPanggung(isi: IsiPoster): Promise<GambarPanggung> {
  const foto = isi.pengisi?.foto;
  if (foto) {
    const b = await ambilGambar(foto.url);
    if (b) {
      return foto.latarDihapus
        ? { jenis: "potongan", uri: await siapkanPotongan(b) }
        : {
            jenis: "bingkai",
            uri: await siapkanBingkai(
              b,
              { lebar: 720, tinggi: 900, muat: "cover" },
              { radius: 64, tepi: 8, warna: WARNA.emas300 },
            ),
          };
    }
  }
  if (isi.gambarAcara) {
    const b = await ambilGambar(isi.gambarAcara);
    if (b) {
      return {
        jenis: "poster",
        uri: await siapkanBingkai(
          b,
          { lebar: 900, tinggi: 1100, muat: "inside" },
          { radius: 36, tepi: 6, warna: "rgba(255,255,255,0.85)" },
        ),
      };
    }
  }
  return null;
}

async function siapkanLogo(url: string | null): Promise<string | null> {
  const b = url ? await ambilGambar(url) : null;
  if (!b) return null;
  const png = await sharp(b)
    .resize(200, 200, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  return uriPng(png);
}

/* ------------------------------- Desain ------------------------------- */

type Ikon = (p: SVGProps<SVGSVGElement>) => ReactNode;

const IKON_JENIS: Record<JenisPoster, Ikon> = {
  khotib: IkonMikrofon,
  pengajianRabu: IkonBuku,
  kuliahSubuh: IkonMatahari,
  pengajianIbu: IkonJam,
  agenda: IkonKalender,
};

const IKON_BARIS: Record<BarisPoster["ikon"], Ikon> = { kalender: IkonKalender, lokasi: IkonPin };

/**
 * Judul sebesar mungkin: sampai 3 baris dengan huruf besar, lalu 4–5 baris untuk
 * judul panjang (perkiraan lebar rata-rata huruf; sisanya dipotong dengan elipsis).
 */
function ukuranJudul(teks: string): { fontSize: number; baris: number } {
  const n = teks.length * 1.08;
  for (const [fontSize, hurufPerBaris, baris] of [
    [100, 16, 3],
    [86, 19, 3],
    [74, 22, 3],
    [64, 26, 3],
    [56, 30, 4],
  ] as const) {
    if (Math.ceil(n / hurufPerBaris) <= baris) return { fontSize, baris };
  }
  return { fontSize: 50, baris: 5 };
}

const ukuranNama = (nama: string) => (nama.length <= 22 ? 64 : nama.length <= 32 ? 54 : 46);

const teksDipotong = (baris: number): CSSProperties => ({ display: "block", lineClamp: baris });

function Kepala({ isi, logo }: { isi: IsiPoster; logo: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, padding: `112px ${SISI}px 0` }}>
      {logo ? (
        <div style={{ display: "flex", width: 100, height: 100, padding: 8, borderRadius: 26, backgroundColor: "#ffffff" }}>
          <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 999,
            backgroundColor: WARNA.emas300,
            color: WARNA.hijau950,
          }}
        >
          <IkonMasjid width={58} height={58} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 1, minWidth: 0 }}>
        <div style={{ ...teksDipotong(1), fontSize: 42, fontWeight: 800, lineHeight: 1.15 }}>{isi.masjid.nama}</div>
        {isi.masjid.wilayah ? (
          <div style={{ ...teksDipotong(1), marginTop: 4, fontSize: 28, fontWeight: 500, color: WARNA.emas200 }}>
            {isi.masjid.wilayah}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Judul({ isi }: { isi: IsiPoster }) {
  const Ikon = IKON_JENIS[isi.jenis];
  const { fontSize, baris } = ukuranJudul(isi.judul);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: `60px ${SISI}px 0` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 30px 12px 22px",
          borderRadius: 999,
          backgroundColor: WARNA.emas300,
          color: WARNA.hijau950,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        <Ikon width={34} height={34} strokeWidth={2.2} />
        <span>{isi.kategori}</span>
      </div>
      <div style={{ ...teksDipotong(baris), marginTop: 28, fontSize, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
        {isi.judul}
      </div>
    </div>
  );
}

function PlatNama({ pengisi, timpa }: { pengisi: PengisiPoster; timpa: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `0 ${SISI}px`,
        ...(timpa ? { position: "absolute", left: 0, right: 0, bottom: 24 } : { marginTop: 22 }),
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "8px 26px",
          borderRadius: 999,
          border: `2px solid ${WARNA.emas300}`,
          backgroundColor: "rgba(7,34,25,0.55)",
          color: WARNA.emas200,
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        {pengisi.peran}
      </div>
      <div
        style={{
          ...teksDipotong(2),
          marginTop: 16,
          fontSize: ukuranNama(pengisi.nama),
          fontWeight: 800,
          lineHeight: 1.12,
          textAlign: "center",
        }}
      >
        {pengisi.nama}
      </div>
      {pengisi.tambahan ? (
        <div style={{ ...teksDipotong(1), marginTop: 10, fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
          {pengisi.tambahan}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Cahaya emas dan lengkung mihrab di belakang foto. Wadahnya memanjang ke
 * atas (cahaya tidak terpotong) dan memotong garis bawah lengkung di dasar
 * panggung.
 */
function LatarPanggung() {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: -200, bottom: 0, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: (UKURAN_POSTER.lebar - 1000) / 2,
          top: 120,
          width: 1000,
          height: 1000,
          backgroundImage:
            "radial-gradient(circle, rgba(230,193,85,0.42) 0%, rgba(220,170,49,0.12) 45%, rgba(220,170,49,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 170,
          right: 170,
          top: 224,
          bottom: -12,
          borderTopLeftRadius: 370,
          borderTopRightRadius: 370,
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: "rgba(230,193,85,0.45)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      />
    </div>
  );
}

function UbinTanggal({ isi }: { isi: IsiPoster }) {
  const [, bulan, tgl] = isi.tanggal.split("-").map(Number);
  const selesai = isi.tanggalSelesai && isi.tanggalSelesai !== isi.tanggal ? isi.tanggalSelesai : "";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 460,
        padding: "40px 0 44px",
        borderRadius: 56,
        backgroundColor: "#ffffff",
        color: WARNA.hijau900,
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 8, color: WARNA.emas600, textTransform: "uppercase" }}>
        {namaHari(isi.tanggal)}
      </div>
      <div style={{ fontSize: 230, fontWeight: 800, lineHeight: 1, marginTop: 6 }}>{String(tgl)}</div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 8 }}>{`${NAMA_BULAN[bulan - 1]} ${isi.tanggal.slice(0, 4)}`}</div>
      {selesai ? (
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 14, color: WARNA.emas600 }}>
          {`s.d. ${Number(selesai.slice(8))} ${NAMA_BULAN[Number(selesai.slice(5, 7)) - 1]}`}
        </div>
      ) : null}
    </div>
  );
}

function Panggung({ isi, gambar }: { isi: IsiPoster; gambar: GambarPanggung }) {
  const isiPenuh: CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" };
  const area: CSSProperties = { display: "flex", flexGrow: 1, flexBasis: 0, minHeight: 0, position: "relative" };

  // Foto tanpa latar: orang berdiri di dasar panggung, nama menimpa bagian bawahnya.
  if (gambar?.jenis === "potongan" && isi.pengisi) {
    return (
      <div style={{ ...area, marginTop: 40 }}>
        <LatarPanggung />
        <div style={{ ...isiPenuh, top: 50 }}>
          <img src={gambar.uri} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "58%",
            backgroundImage: `linear-gradient(180deg, rgba(7,34,25,0) 0%, rgba(7,34,25,0.82) 48%, ${WARNA.hijau950} 100%)`,
          }}
        />
        <PlatNama pengisi={isi.pengisi} timpa />
      </div>
    );
  }

  return (
    <div style={{ ...area, flexDirection: "column", marginTop: 40 }}>
      <div style={{ ...area, alignItems: "center", justifyContent: "center" }}>
        {isi.pengisi && <LatarPanggung />}
        {isi.pengisi && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "30%",
              backgroundImage: "linear-gradient(180deg, rgba(7,34,25,0) 0%, rgba(7,34,25,0.9) 100%)",
            }}
          />
        )}
        {gambar ? (
          <div style={{ ...isiPenuh, padding: `8px ${SISI}px` }}>
            <img src={gambar.uri} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ) : isi.pengisi ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 400,
              height: 400,
              borderRadius: 999,
              border: `6px solid ${WARNA.emas300}`,
              backgroundColor: "rgba(7,34,25,0.55)",
              color: WARNA.emas200,
              fontSize: 160,
              fontWeight: 800,
            }}
          >
            {inisialNama(isi.pengisi.nama) || "?"}
          </div>
        ) : (
          <UbinTanggal isi={isi} />
        )}
      </div>
      {isi.pengisi && <PlatNama pengisi={isi.pengisi} timpa={false} />}
    </div>
  );
}

function BarisInfo({ baris }: { baris: BarisPoster }) {
  const Ikon = IKON_BARIS[baris.ikon];
  const waktu = baris.ikon === "kalender";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 84,
          height: 84,
          borderRadius: 999,
          backgroundColor: WARNA.emas300,
          color: WARNA.hijau950,
        }}
      >
        <Ikon width={44} height={44} strokeWidth={2} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <div style={{ ...teksDipotong(2), fontSize: 42, fontWeight: 800, lineHeight: 1.18 }}>{baris.teks}</div>
        {baris.sub ? (
          <div
            style={{
              ...teksDipotong(2),
              marginTop: 4,
              fontSize: 31,
              lineHeight: 1.3,
              fontWeight: waktu ? 700 : 500,
              color: waktu ? WARNA.emas200 : "rgba(255,255,255,0.75)",
            }}
          >
            {baris.sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Poster({ isi, gambar, logo }: { isi: IsiPoster; gambar: GambarPanggung; logo: string | null }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: UKURAN_POSTER.lebar,
        height: UKURAN_POSTER.tinggi,
        fontFamily: "Jakarta",
        color: "#ffffff",
        backgroundColor: WARNA.hijau950,
        backgroundImage: `linear-gradient(180deg, ${WARNA.hijau700} 0%, ${WARNA.hijau900} 34%, ${WARNA.hijau950} 68%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: UKURAN_POSTER.lebar,
          height: UKURAN_POSTER.tinggi,
          backgroundImage: POLA,
          backgroundSize: "140px 140px",
          backgroundRepeat: "repeat",
        }}
      />
      <Kepala isi={isi} logo={logo} />
      <Judul isi={isi} />
      <Panggung isi={isi} gambar={gambar} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          margin: `28px ${SISI - 16}px 0`,
          padding: "34px 40px",
          borderRadius: 44,
          border: "2px solid rgba(230,193,85,0.35)",
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        {isi.baris.map((b) => (
          <BarisInfo key={b.ikon} baris={b} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `30px ${SISI}px 92px` }}>
        <div style={{ ...teksDipotong(1), fontSize: 30, fontWeight: 700, color: WARNA.emas200 }}>{isi.ajakan}</div>
        <div style={{ ...teksDipotong(1), marginTop: 8, fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>
          {isi.situs.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>
  );
}

/** Semua teks poster melalui teksAmanPoster; judul kosong diganti nama kategori. */
function isiAman(isi: IsiPoster, ketat: boolean): IsiPoster {
  const t = (teks: string) => teksAmanPoster(teks, { ketat });
  const [waktu, tempat] = isi.baris;
  return {
    ...isi,
    judul: t(isi.judul) || isi.kategori,
    pengisi: isi.pengisi && { ...isi.pengisi, nama: t(isi.pengisi.nama), tambahan: t(isi.pengisi.tambahan) },
    baris: [
      { ...waktu, teks: t(waktu.teks), sub: t(waktu.sub) },
      { ...tempat, teks: t(tempat.teks), sub: t(tempat.sub) },
    ],
    masjid: { nama: t(isi.masjid.nama), wilayah: t(isi.masjid.wilayah) },
  };
}

/** Poster story dalam format JPEG. */
export async function buatPoster(isi: IsiPoster): Promise<Buffer> {
  const [fonts, gambar, logo] = await Promise.all([muatFont(), siapkanPanggung(isi), siapkanLogo(isi.logo)]);
  const gambarkan = (ketat: boolean) =>
    new ImageResponse(<Poster isi={isiAman(isi, ketat)} gambar={gambar} logo={logo} />, {
      width: UKURAN_POSTER.lebar,
      height: UKURAN_POSTER.tinggi,
      fonts,
    }).arrayBuffer();
  let png: ArrayBuffer;
  try {
    png = await gambarkan(false);
  } catch (err) {
    // Mis. karakter langka yang fontnya diunduh otomatis gagal dibaca: ulangi tanpa karakter di luar font.
    console.warn("[poster] Menggambar ulang tanpa karakter di luar font:", err);
    png = await gambarkan(true);
  }
  // 4:4:4 supaya tulisan emas di atas hijau tetap tajam.
  return sharp(Buffer.from(png)).jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
}
