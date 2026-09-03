import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireAdmin, HttpError } from "@/lib/guard";

type Ctx = { params: Promise<{ id: string }> };
const PERAN = ["Admin", "Team Member", "Pembaca"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** PATCH /api/users/:id — ubah peran atau status aktif (Admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    const target = await db.query.user.findFirst({ where: eq(schema.user.id, id) });
    if (!target) throw new HttpError(404, "Pengguna tidak ditemukan.");

    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (body.peran !== undefined) {
      if (!PERAN.includes(body.peran)) throw new HttpError(400, "Peran tidak dikenal.");
      // Cegah Admin menurunkan perannya sendiri dan mengunci diri dari sistem.
      if (target.id === admin.id && body.peran !== "Admin") {
        throw new HttpError(400, "Anda tidak dapat menurunkan peran akun Anda sendiri.");
      }
      patch.peran = body.peran;
    }

    if (body.aktif !== undefined) {
      if (target.id === admin.id && body.aktif === false) {
        throw new HttpError(400, "Anda tidak dapat menonaktifkan akun Anda sendiri.");
      }
      patch.aktif = !!body.aktif;
    }

    if (typeof body.unit === "string" && body.unit.trim()) patch.unit = body.unit.trim();

    if (typeof body.nama === "string" && body.nama.trim()) patch.name = body.nama.trim();

    if (typeof body.email === "string" && body.email.trim()) {
      const email = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(400, "Format email tidak valid.");
      if (email !== target.email) {
        const dipakai = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
        if (dipakai) throw new HttpError(409, "Email sudah dipakai pengguna lain.");
        patch.email = email;
      }
    }

    const [row] = await db.update(schema.user).set(patch).where(eq(schema.user.id, id)).returning();
    return {
      user: { id: row.id, nama: row.name, email: row.email, unit: row.unit, peran: row.peran, aktif: row.aktif },
    };
  });
}

/** DELETE /api/users/:id — hapus pengguna (Admin). */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await params;

    if (id === admin.id) throw new HttpError(400, "Anda tidak dapat menghapus akun Anda sendiri.");

    const target = await db.query.user.findFirst({ where: eq(schema.user.id, id) });
    if (!target) throw new HttpError(404, "Pengguna tidak ditemukan.");

    // Dokumen milik pengguna tetap tersimpan (arsip tidak boleh hilang);
    // relasi documents.user_id memakai RESTRICT bawaan, jadi cek dulu.
    const punyaDokumen = await db.query.documents.findFirst({
      where: (d, { eq: e }) => e(d.userId, id),
    });
    if (punyaDokumen) {
      throw new HttpError(
        409,
        `${target.name} masih memiliki dokumen di arsip. Nonaktifkan akunnya alih-alih menghapus.`,
      );
    }

    await db.delete(schema.user).where(eq(schema.user.id, id));
    return { ok: true, nama: target.name };
  });
}
