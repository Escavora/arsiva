import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Penjaga rute di tepi. Sengaja memakai nama `middleware` (runtime edge), bukan
 * `proxy` (runtime Node): proxy Node masih eksperimental di Cloudflare dan
 * membuat bundle Worker melewati batas 3 MB paket gratis.
 *
 * Ini hanya mengarahkan pengunjung yang belum masuk ke /login. Ini BUKAN
 * pengganti otorisasi: peran, status aktif, dan batas idle 30 menit ditegakkan
 * di setiap API route lewat requireUser/requireAdmin (src/lib/guard.ts).
 */
const rutePrivat = createRouteMatcher([
  "/dashboard(.*)",
  "/arsip(.*)",
  "/unggah(.*)",
  "/pengingat(.*)",
  "/bagikan(.*)",
  "/notaris(.*)",
  "/kategori(.*)",
  "/akses(.*)",
  "/sandi(.*)",
]);
const ruteLogin = createRouteMatcher(["/login(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (rutePrivat(req) && !userId) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Sudah masuk tapi membuka /login → langsung ke dashboard. Halaman /login
  // yang membawa ?reason (mis. sesi idle berakhir) dibiarkan tampil.
  if (ruteLogin(req) && userId && !req.nextUrl.searchParams.has("reason")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Semua rute kecuali berkas statis dan internal Next.js.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API wajib ikut dicakup agar auth() dapat dipakai di route handler.
    "/(api|trpc)(.*)",
  ],
};
