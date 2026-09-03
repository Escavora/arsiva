import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser } from "@/lib/guard";

/** GET /api/notifications — notifikasi in-app milik pengguna yang sedang masuk. */
export async function GET() {
  return handle(async () => {
    const u = await requireUser();
    const rows = await db.query.notifications.findMany({
      where: eq(schema.notifications.userId, u.id),
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 50,
    });
    return {
      notifications: rows.map((n) => ({
        id: n.id,
        judul: n.judul,
        pesan: n.pesan,
        tipe: n.tipe,
        documentId: n.documentId,
        dibaca: n.dibacaAt !== null,
        createdAt: n.createdAt.toISOString(),
      })),
      belumDibaca: rows.filter((n) => n.dibacaAt === null).length,
    };
  });
}

/** PATCH /api/notifications — tandai semua notifikasi sudah dibaca. */
export async function PATCH() {
  return handle(async () => {
    const u = await requireUser();
    await db
      .update(schema.notifications)
      .set({ dibacaAt: new Date() })
      .where(and(eq(schema.notifications.userId, u.id), isNull(schema.notifications.dibacaAt)));
    return { ok: true };
  });
}
