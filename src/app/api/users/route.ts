import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { handle, requireUser, requireAdmin, HttpError } from "@/lib/guard";
import { eq } from "drizzle-orm";

const PERAN = ["Admin", "Team Member", "Pembaca"] as const;

/** GET /api/users — daftar pengguna (semua peran boleh melihat, mode baca). */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.user.findMany({ orderBy: [asc(schema.user.createdAt)] });
    return {
      users: rows.map((u) => ({
        id: u.id,
        nama: u.name,
        email: u.email,
        unit: u.unit,
        peran: u.peran,
        aktif: u.aktif,
      })),
    };
  });
}

/** POST /api/users — tambah pengguna (Admin). */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { nama, email, unit, peran, password } = await req.json();

    const n = String(nama ?? "").trim();
    const mail = String(email ?? "").trim().toLowerCase();
    if (!n) throw new HttpError(400, "Isi nama pengguna.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new HttpError(400, "Email korporat tidak valid.");
    if (!PERAN.includes(peran)) throw new HttpError(400, "Peran tidak dikenal.");

    const exists = await db.query.user.findFirst({ where: eq(schema.user.email, mail) });
    if (exists) throw new HttpError(409, "Email sudah terdaftar.");

    const pass = String(password ?? "").trim() || "arsiva123";
    if (pass.length < 8) throw new HttpError(400, "Kata sandi minimal 8 karakter.");

    // Dibuat lewat Better Auth agar kata sandi ter-hash dengan benar.
    const res = await auth.api.signUpEmail({ body: { email: mail, password: pass, name: n } });

    await db
      .update(schema.user)
      .set({ peran, unit: String(unit ?? "").trim() || "Divisi Legal", aktif: true })
      .where(eq(schema.user.id, res.user.id));

    return {
      user: { id: res.user.id, nama: n, email: mail, unit: String(unit ?? "").trim() || "Divisi Legal", peran, aktif: true },
      passwordAwal: pass,
    };
  });
}
