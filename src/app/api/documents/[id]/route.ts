import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireWriter, requireAdmin, HttpError } from "@/lib/guard";
import { docWith, mapDoc } from "@/lib/dto";
import { getStorage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

async function findDoc(id: number) {
  const row = await db.query.documents.findFirst({
    where: eq(schema.documents.id, id),
    with: docWith,
  });
  if (!row) throw new HttpError(404, "Dokumen tidak ditemukan.");
  return row;
}

/** GET /api/documents/:id — detail dokumen. */
export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireUser();
    const { id } = await params;
    return { doc: mapDoc(await findDoc(Number(id))) };
  });
}

/**
 * PATCH /api/documents/:id — ubah informasi atau tandai diproses.
 * Body: { p?: boolean, nama?, ket?, exp?, categoryId?, typeId?, purposeId? }
 */
export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireWriter();
    const { id } = await params;
    const docId = Number(id);
    const doc = await findDoc(docId);
    const body = await req.json();

    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.p === "boolean") {
      patch.status = body.p ? "diproses" : "aktif";
      // Catat/urungkan jejak pengingat sesuai PRD (document_reminders.processed_at)
      if (body.p) {
        await db.insert(schema.documentReminders).values({
          documentId: docId,
          processedAt: new Date(),
        });
      } else {
        await db.delete(schema.documentReminders).where(eq(schema.documentReminders.documentId, docId));
      }
    }
    if (typeof body.nama === "string" && body.nama.trim()) patch.namaDokumen = body.nama.trim();
    if (typeof body.ket === "string") patch.keterangan = body.ket;
    if (typeof body.exp === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.exp)) {
      patch.tanggalKadaluarsa = body.exp;
    }
    for (const key of ["categoryId", "typeId", "purposeId"] as const) {
      if (body[key] != null && !Number.isNaN(Number(body[key]))) patch[key] = Number(body[key]);
    }

    await db.update(schema.documents).set(patch).where(eq(schema.documents.id, doc.id));
    return { doc: mapDoc(await findDoc(docId)) };
  });
}

/** DELETE /api/documents/:id — hanya Admin. Berkas ikut dihapus dari storage. */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;
    const doc = await findDoc(Number(id));
    if (doc.filePath) await getStorage().delete(doc.filePath);
    await db.delete(schema.documents).where(eq(schema.documents.id, doc.id));
    return { ok: true };
  });
}
