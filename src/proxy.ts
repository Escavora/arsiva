import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Penjaga rute di tepi (Next.js 16 menyebutnya "proxy", dahulu "middleware").
 *
 * Ini hanya pemeriksaan cepat "ada cookie sesi atau tidak" untuk mengarahkan
 * pengunjung yang belum masuk ke /login. Ini BUKAN pengganti otorisasi:
 * validasi sesi dan pengecekan peran yang sebenarnya tetap dilakukan di setiap
 * API route lewat requireUser/requireAdmin (src/lib/guard.ts).
 */
const RUTE_TERLINDUNGI = [
  "/dashboard",
  "/arsip",
  "/unggah",
  "/pengingat",
  "/bagikan",
  "/notaris",
  "/kategori",
  "/akses",
  "/sandi",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const punyaSesi = !!getSessionCookie(req);

  const terlindungi = RUTE_TERLINDUNGI.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );

  if (terlindungi && !punyaSesi) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Sudah masuk tapi membuka /login → langsung ke dashboard.
  if (pathname === "/login" && punyaSesi) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/arsip/:path*",
    "/unggah/:path*",
    "/pengingat/:path*",
    "/bagikan/:path*",
    "/notaris/:path*",
    "/kategori/:path*",
    "/akses/:path*",
    "/sandi/:path*",
    "/login",
  ],
};
