import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireAdmin, HttpError } from "@/lib/guard";

/** GET /api/categories — daftar kategori beserta jumlah dokumennya. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db
      .select({
        id: schema.categories.id,
        nama: schema.categories.nama,
        desk: schema.categories.deskripsi,
        jumlah: sql<number>`count(${schema.documents.id})`.mapWith(Number),
      })
      .from(schema.categories)
      .leftJoin(schema.documents, sql`${schema.documents.categoryId} = ${schema.categories.id}`)
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.id));
    return { cats: rows };
  });
}

/** POST /api/categories — tambah kategori (Admin). */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const { nama, desk } = await req.json();
    const name = String(nama ?? "").trim();
    if (!name) throw new HttpError(400, "Isi nama kategori terlebih dahulu.");

    const exists = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.nama, name),
    });
    if (exists) throw new HttpError(409, `Kategori "${name}" sudah ada.`);

    const [row] = await db
      .insert(schema.categories)
      .values({ nama: name, deskripsi: String(desk ?? "").trim() || "—" })
      .returning();
    return { cat: { ...row, desk: row.deskripsi, jumlah: 0 } };
  });
}
