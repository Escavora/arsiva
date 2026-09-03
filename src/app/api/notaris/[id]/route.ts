import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireAdmin, HttpError } from "@/lib/guard";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/notaris/:id — hapus mitra (Admin). Jadwalnya ikut terhapus (cascade). */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const row = await db.query.notaris.findFirst({
      where: eq(schema.notaris.id, Number(id)),
    });
    if (!row) throw new HttpError(404, "Mitra notaris tidak ditemukan.");
    await db.delete(schema.notaris).where(eq(schema.notaris.id, row.id));
    return { ok: true, nama: row.nama };
  });
}
