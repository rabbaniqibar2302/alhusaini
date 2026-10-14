import { NextResponse, type NextRequest } from "next/server";
import { originSama } from "@/lib/origin";
import { cabutSesiDariToken } from "@/server/auth/sesi";
import { NAMA_COOKIE_SESI, opsiCookieSesi } from "@/server/auth/token";

/** Logout: cabut sesi di Redis dan hapus cookie. Hanya menerima POST. */
export async function POST(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protokol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol;
  if (!originSama(request.headers.get("origin"), host, protokol)) {
    return new NextResponse("Permintaan ditolak.", { status: 403 });
  }

  try {
    await cabutSesiDariToken(request.cookies.get(NAMA_COOKIE_SESI)?.value);
  } catch (err) {
    console.error("[logout] Gagal mencabut sesi:", err);
  }

  const balasan = NextResponse.redirect(new URL("/admin/login?keluar=1", request.url), 303);
  balasan.cookies.set(NAMA_COOKIE_SESI, "", opsiCookieSesi(0));
  balasan.headers.set("cache-control", "no-store");
  return balasan;
}
