/**
 * Berkas suara adzan: format yang diterima, batas ukuran, dan deteksi tipe
 * asli dari magic bytes (dipakai di browser sebelum unggah dan di server
 * sesudahnya). Tanpa zod supaya ringan untuk browser.
 */

export const UKURAN_MAKS_AUDIO = 15 * 1024 * 1024;

export const FORMAT_AUDIO = {
  mp3: { mime: "audio/mpeg", label: "MP3" },
  m4a: { mime: "audio/mp4", label: "M4A" },
  ogg: { mime: "audio/ogg", label: "OGG" },
} as const;
export type FormatAudio = keyof typeof FORMAT_AUDIO;

export const JENIS_ADZAN = ["umum", "subuh"] as const;
export type JenisAdzan = (typeof JENIS_ADZAN)[number];

/** Nama berkas di Vercel Blob: `masjid/audio/<uuid>.<format>`. */
export const POLA_PATHNAME_AUDIO = /^masjid\/audio\/[0-9a-f-]{36}\.(mp3|m4a|ogg)$/;

export function deteksiFormatAudio(b: Uint8Array): FormatAudio | null {
  const ascii = (dari: number, sampai: number) => String.fromCharCode(...b.subarray(dari, sampai));
  if (b.length >= 3 && ascii(0, 3) === "ID3") return "mp3";
  // Frame MPEG audio: 11 bit sinkronisasi, versi bukan "reserved", layer bukan "reserved"
  // (sekaligus menolak AAC/ADTS yang layer-nya 00).
  if (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x18) !== 0x08 && (b[1] & 0x06) !== 0) {
    return "mp3";
  }
  if (b.length >= 8 && ascii(4, 8) === "ftyp") return "m4a";
  if (b.length >= 4 && ascii(0, 4) === "OggS") return "ogg";
  return null;
}

/** Ukuran file untuk ditampilkan, mis. "5,5 MB" atau "96 KB". */
export function ukuranAudio(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
