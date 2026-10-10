import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { buatAkun, hapusAkun, idTertautGoogle } from "@/lib/clerk-users";
import { handle, requireUser, requireAdmin, HttpError } from "@/lib/guard";
import { eq } from "drizzle-orm";

const PERAN = ["Admin", "Team Member", "Pembaca"] as const;

/** GET /api/users — daftar pengguna (semua peran boleh melihat, mode baca). */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.user.findMany({ orderBy: [asc(schema.user.createdAt)] });
    const google = await idTertautGoogle(rows.flatMap((u) => (u.clerkId ? [u.clerkId] : [])));
    return {
      users: rows.map((u) => ({
        id: u.id,
        nama: u.name,
        email: u.email,
        unit: u.unit,
        peran: u.peran,
        aktif: u.aktif,
        // null = tidak diketahui (Clerk tidak terjangkau)
        google: google ? (u.clerkId ? google.has(u.clerkId) : false) : null,
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

    const unitKerja = String(unit ?? "").trim() || "Divisi Legal";

    // Akun dibuat di Clerk (yang menyimpan kata sandi), lalu profilnya di sini.
    const clerkId = await buatAkun({ nama: n, email: mail, password: pass });
    try {
      const [row] = await db
        .insert(schema.user)
        .values({ clerkId, name: n, email: mail, unit: unitKerja, peran, aktif: true })
        .returning();
      return {
        user: { id: row.id, nama: n, email: mail, unit: unitKerja, peran, aktif: true },
        passwordAwal: pass,
      };
    } catch (err) {
      // Jangan tinggalkan akun Clerk yatim bila profil lokal gagal dibuat.
      await hapusAkun(clerkId).catch((e) => console.error("[arsiva:clerk] gagal membatalkan akun:", e));
      throw err;
    }
  });
}
