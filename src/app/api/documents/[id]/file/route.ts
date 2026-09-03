import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser, HttpError } from "@/lib/guard";
import { getStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/:id/file — mengalirkan berkas hasil scan.
 * Berkas TIDAK disajikan sebagai file statis; setiap permintaan wajib bersesi,
 * sehingga folder storage tidak bisa diakses langsung dari browser.
 */
export async function GET(req: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const doc = await db.query.documents.findFirst({
      where: eq(schema.documents.id, Number(id)),
    });
    if (!doc?.filePath) {
      return Response.json({ error: "Berkas tidak tersedia." }, { status: 404 });
    }

    const file = await getStorage().get(doc.filePath);
    if (!file) return Response.json({ error: "Berkas tidak ditemukan." }, { status: 404 });

    const unduh = new URL(req.url).searchParams.get("unduh") === "1";
    const nama = doc.fileName ?? file.fileName;
    return new Response(new Uint8Array(file.body), {
      headers: {
        "Content-Type": doc.mimeType ?? file.mimeType,
        "Content-Length": String(file.body.byteLength),
        "Content-Disposition": `${unduh ? "attachment" : "inline"}; filename="${encodeURIComponent(nama)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Gagal memuat berkas.";
    return Response.json({ error: message }, { status });
  }
}
