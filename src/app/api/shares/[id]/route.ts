import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireWriter, HttpError } from "@/lib/guard";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/shares/:id — cabut akses tautan (Admin & Staf Legal). */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireWriter();
    const { id } = await params;

    const row = await db.query.documentShares.findFirst({
      where: eq(schema.documentShares.id, Number(id)),
    });
    if (!row) throw new HttpError(404, "Tautan tidak ditemukan.");
    if (row.revokedAt) throw new HttpError(409, "Tautan sudah dicabut sebelumnya.");

    await db
      .update(schema.documentShares)
      .set({ revokedAt: new Date() })
      .where(eq(schema.documentShares.id, row.id));

    return { ok: true };
  });
}
