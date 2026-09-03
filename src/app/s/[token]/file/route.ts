import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /s/:token/file — berkas untuk penerima tautan (tanpa login).
 * Akses hanya sah bila token cocok, belum dicabut, dan belum kadaluarsa.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { token } = await params;

  const share = await db.query.documentShares.findFirst({
    where: eq(schema.documentShares.token, token),
    with: { dokumen: true },
  });

  if (!share) return Response.json({ error: "Tautan tidak dikenal." }, { status: 404 });
  if (share.revokedAt) return Response.json({ error: "Akses tautan telah dicabut." }, { status: 403 });
  if (share.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "Masa berlaku tautan sudah habis." }, { status: 410 });
  }

  const doc = share.dokumen;
  if (!doc?.filePath) return Response.json({ error: "Berkas tidak tersedia." }, { status: 404 });

  const file = await getStorage().get(doc.filePath);
  if (!file) return Response.json({ error: "Berkas tidak ditemukan." }, { status: 404 });

  const unduh = new URL(req.url).searchParams.get("unduh") === "1";
  const nama = doc.fileName ?? file.fileName;
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": doc.mimeType ?? file.mimeType,
      "Content-Length": String(file.body.byteLength),
      "Content-Disposition": `${unduh ? "attachment" : "inline"}; filename="${encodeURIComponent(nama)}"`,
      // Jangan sampai tersimpan di cache bersama / proxy.
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
