import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireWriter, HttpError } from "@/lib/guard";

/** GET /api/schedules — seluruh jadwal kerja sama. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.schedules.findMany({
      orderBy: [asc(schema.schedules.tanggal)],
      with: { notaris: { columns: { nama: true } } },
    });
    return {
      schedules: rows.map((s) => ({
        id: s.id,
        notarisId: s.notarisId,
        notarisNama: s.notaris?.nama ?? "—",
        agenda: s.agenda,
        tgl: s.tanggal,
        jam: s.jam,
        st: s.status,
      })),
    };
  });
}

/** POST /api/schedules — tambah jadwal (Admin & Team Member). */
export async function POST(req: Request) {
  return handle(async () => {
    await requireWriter();
    const { notarisId, agenda, tgl, jam } = await req.json();

    const a = String(agenda ?? "").trim();
    if (!a) throw new HttpError(400, "Isi agenda kerja sama terlebih dahulu.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tgl ?? ""))) {
      throw new HttpError(400, "Tanggal jadwal tidak valid.");
    }
    const nid = Number(notarisId);
    const mitra = await db.query.notaris.findFirst({
      where: (n, { eq }) => eq(n.id, nid),
    });
    if (!mitra) throw new HttpError(404, "Mitra notaris tidak ditemukan.");

    const [row] = await db
      .insert(schema.schedules)
      .values({ notarisId: nid, agenda: a, tanggal: String(tgl), jam: String(jam || "09:00") })
      .returning();

    return {
      schedule: {
        id: row.id,
        notarisId: row.notarisId,
        notarisNama: mitra.nama,
        agenda: row.agenda,
        tgl: row.tanggal,
        jam: row.jam,
        st: row.status,
      },
    };
  });
}
