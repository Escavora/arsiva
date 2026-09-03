import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, HttpError } from "@/lib/guard";

/** GET /api/me — profil & pengaturan pengguna yang sedang masuk. */
export async function GET() {
  return handle(async () => {
    const u = await requireUser();
    return {
      me: {
        id: u.id,
        nama: u.name,
        email: u.email,
        unit: u.unit,
        peran: u.peran,
        threshold: u.reminderThresholdDays ?? 60,
      },
    };
  });
}

/** PATCH /api/me — ubah ambang pengingat pribadi (PRD: reminder_threshold_days). */
export async function PATCH(req: Request) {
  return handle(async () => {
    const u = await requireUser();
    const { threshold } = await req.json();

    const t = Number(threshold);
    if (![30, 60, 90].includes(t)) throw new HttpError(400, "Ambang pengingat harus 30, 60, atau 90 hari.");

    await db
      .update(schema.user)
      .set({ reminderThresholdDays: t, updatedAt: new Date() })
      .where(eq(schema.user.id, u.id));

    return { ok: true, threshold: t };
  });
}
