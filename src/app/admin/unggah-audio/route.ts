import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { FORMAT_AUDIO, POLA_PATHNAME_AUDIO, UKURAN_MAKS_AUDIO, type FormatAudio } from "@/lib/audio";
import { originSama } from "@/lib/origin";
import { bacaSesi } from "@/server/auth/sesi";

/**
 * Memberi token unggah sekali pakai agar browser admin bisa mengunggah file
 * adzan langsung ke Vercel Blob. Hanya untuk admin yang login (dicek di proxy
 * dan di sini), hanya untuk nama file acak di folder masjid/audio, dengan tipe
 * audio dan batas ukuran yang ditegakkan oleh Vercel Blob. File baru dipakai
 * setelah didaftarkan & diperiksa lewat server action simpanAudioAdzan.
 */

function tolak(pesan: string, status: number) {
  return NextResponse.json({ error: pesan }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protokol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  if (!originSama(request.headers.get("origin"), host, protokol)) return tolak("Permintaan ditolak.", 403);
  if (!(await bacaSesi())) return tolak("Sesi tidak valid atau sudah berakhir. Silakan login kembali.", 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return tolak("Penyimpanan file (Vercel Blob) belum dikonfigurasi.", 503);
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return tolak("Permintaan tidak valid.", 400);
  }
  // Tidak memakai callback "upload selesai"; pendaftaran file lewat server action.
  if (body?.type !== "blob.generate-client-token") return tolak("Permintaan tidak valid.", 400);

  try {
    const hasil = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const format = POLA_PATHNAME_AUDIO.exec(pathname)?.[1] as FormatAudio | undefined;
        if (!format) throw new Error("Nama file tidak valid");
        return {
          allowedContentTypes: [FORMAT_AUDIO[format].mime],
          maximumSizeInBytes: UKURAN_MAKS_AUDIO,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(hasil, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.warn("[unggah-audio] Token ditolak:", (err as Error).message);
    return tolak("Permintaan unggah ditolak.", 400);
  }
}
