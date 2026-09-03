import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireAdmin, HttpError } from "@/lib/guard";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/categories/:id — ubah nama/keterangan (Admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const { nama, desk } = await req.json();

    const patch: Record<string, unknown> = {};
    if (typeof nama === "string" && nama.trim()) patch.nama = nama.trim();
    if (typeof desk === "string") patch.deskripsi = desk.trim();
    if (!Object.keys(patch).length) throw new HttpError(400, "Tidak ada perubahan.");

    const [row] = await db
      .update(schema.categories)
      .set(patch)
      .where(eq(schema.categories.id, Number(id)))
      .returning();
    if (!row) throw new HttpError(404, "Kategori tidak ditemukan.");
    return { cat: { ...row, desk: row.deskripsi } };
  });
}

/** DELETE /api/categories/:id — hapus kategori (Admin). */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const row = await db.query.categories.findFirst({
      where: eq(schema.categories.id, Number(id)),
    });
    if (!row) throw new HttpError(404, "Kategori tidak ditemukan.");

    // Dokumen tidak ikut terhapus — kategorinya dikosongkan (ON DELETE SET NULL).
    await db.delete(schema.categories).where(eq(schema.categories.id, row.id));
    return { ok: true, nama: row.nama };
  });
}
