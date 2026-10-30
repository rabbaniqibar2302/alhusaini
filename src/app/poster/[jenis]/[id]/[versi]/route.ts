import { unstable_rethrow } from "next/navigation";
import type { NextRequest } from "next/server";
import { jalurPoster, jenisPosterDariSlug, type IsiPoster } from "@/lib/poster";
import { cariIsiPoster } from "@/server/poster/data";
import { buatPoster } from "@/server/poster/gambar";

/**
 * Poster story (JPEG 1080×1920) jadwal khotib, kajian, atau agenda untuk
 * dibagikan ke status WhatsApp.
 *
 * URL memuat versi isi poster, jadi gambar di satu URL tidak pernah berubah
 * dan boleh di-cache CDN maupun browser selamanya. Versi lama (jadwal sudah
 * diubah admin) dan URL tidak baku (mis. ditambah query) dialihkan ke URL
 * terbaru, sehingga server hanya menggambar satu URL per versi dan tidak bisa
 * dibebani dengan URL acak.
 */

const POLA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const GAGAL = "Poster sedang tidak dapat dibuat. Silakan coba lagi sebentar.";

function balasTeks(pesan: string, status: number) {
  return new Response(pesan, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: NextRequest, { params }: RouteContext<"/poster/[jenis]/[id]/[versi]">) {
  const { jenis: slug, id } = await params;
  const jenis = jenisPosterDariSlug(slug);
  if (!jenis || !POLA_ID.test(id)) return balasTeks("Poster tidak ditemukan.", 404);

  let isi: IsiPoster | null;
  try {
    isi = await cariIsiPoster(jenis, id);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[poster] Gagal membaca database:", err);
    return balasTeks(GAGAL, 503);
  }
  if (!isi) return balasTeks("Poster tidak ditemukan.", 404);

  const jalur = jalurPoster(isi);
  if (request.nextUrl.pathname !== jalur || request.nextUrl.search !== "") {
    return new Response(null, { status: 307, headers: { location: jalur, "cache-control": "no-store" } });
  }

  try {
    const gambar = await buatPoster(isi);
    return new Response(new Uint8Array(gambar), {
      headers: {
        "content-type": "image/jpeg",
        "content-disposition": `inline; filename="${isi.namaBerkas}"`,
        "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "x-robots-tag": "noindex",
      },
    });
  } catch (err) {
    unstable_rethrow(err);
    console.error("[poster] Gagal membuat gambar poster:", err);
    return balasTeks(GAGAL, 503);
  }
}
