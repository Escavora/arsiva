import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireWriter, HttpError } from "@/lib/guard";

type Ctx = { params: Promise<{ id: string }> };

const STATUS = ["Direncanakan", "Selesai", "Dibatalkan"] as const;

/** PATCH /api/schedules/:id — ubah status jadwal (mis. Batalkan / Selesai). */
export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireWriter();
    const { id } = await params;
    const { st } = await req.json();

    if (!STATUS.includes(st)) throw new HttpError(400, "Status jadwal tidak dikenal.");

    const [row] = await db
      .update(schema.schedules)
      .set({ status: st })
      .where(eq(schema.schedules.id, Number(id)))
      .returning();
    if (!row) throw new HttpError(404, "Jadwal tidak ditemukan.");
    return { ok: true, st: row.status };
  });
}
