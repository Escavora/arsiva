import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireAdmin, HttpError } from "@/lib/guard";

/** GET /api/notaris — daftar mitra notaris beserta jadwalnya. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.notaris.findMany({
      orderBy: [asc(schema.notaris.id)],
      with: { jadwal: true },
    });
    return {
      notaris: rows.map((n) => ({
        id: n.id,
        nama: n.nama,
        kantor: n.kantor,
        email: n.email,
        tel: n.noTelepon,
        jumlahJadwal: n.jadwal.length,
      })),
    };
  });
}

/** POST /api/notaris — tambah mitra notaris (Admin). */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { nama, kantor, email, tel } = await req.json();
    const n = String(nama ?? "").trim();
    const k = String(kantor ?? "").trim();
    if (!n) throw new HttpError(400, "Isi nama notaris.");
    if (!k) throw new HttpError(400, "Isi kantor/wilayah notaris.");

    const [row] = await db
      .insert(schema.notaris)
      .values({
        nama: n,
        kantor: k,
        email: String(email ?? "").trim(),
        noTelepon: String(tel ?? "").trim(),
      })
      .returning();

    return {
      notaris: {
        id: row.id,
        nama: row.nama,
        kantor: row.kantor,
        email: row.email,
        tel: row.noTelepon,
        jumlahJadwal: 0,
      },
    };
  });
}
