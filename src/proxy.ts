import { NextResponse, type NextRequest } from "next/server";
import { originSama } from "@/lib/origin";
import { verifikasiSesiDariToken } from "@/server/auth/sesi-aktif";
import { NAMA_COOKIE_SESI } from "@/server/auth/token";

/**
 * Proxy (nama baru "middleware" sejak Next.js 16), berjalan sebelum setiap
 * request:
 * 1. CSRF: request yang mengubah data (POST/PUT/PATCH/DELETE, termasuk server
 *    action) wajib membawa header Origin yang sama dengan host situs.
 * 2. Situs publik bersifat baca-saja: request pengubah data di luar /admin
 *    langsung ditolak.
 * 3. Seluruh /admin (halaman maupun server action) wajib punya sesi yang
 *    valid (JWT bertanda tangan + sesi masih aktif di Redis), kecuali
 *    /admin/login dan /admin/logout.
 *
 * Ini lapisan pertama saja. Setiap halaman admin dan server action tetap
 * memeriksa ulang sesi di server, jadi keamanan tidak bergantung pada proxy.
 */

const METODE_AMAN = new Set(["GET", "HEAD", "OPTIONS"]);
const JALUR_TANPA_SESI = new Set(["/admin/login", "/admin/logout"]);

function balasTeks(pesan: string, status: number, header: Record<string, string> = {}) {
  return new NextResponse(pesan, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...header },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const areaAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const metodeAman = METODE_AMAN.has(request.method);

  if (!metodeAman) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const protokol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
    if (!originSama(request.headers.get("origin"), host, protokol)) {
      return balasTeks("Permintaan ditolak: Origin tidak valid.", 403);
    }
    if (!areaAdmin) {
      return balasTeks("Metode tidak diizinkan.", 405, { allow: "GET, HEAD" });
    }
  }

  if (!areaAdmin || JALUR_TANPA_SESI.has(pathname)) {
    return NextResponse.next();
  }

  const sesi = await verifikasiSesiDariToken(request.cookies.get(NAMA_COOKIE_SESI)?.value);
  if (!sesi) {
    if (!metodeAman) {
      return balasTeks("Sesi tidak valid atau sudah berakhir. Silakan login kembali.", 401);
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|__nextjs|images/|hapus-latar/|icon.svg|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
