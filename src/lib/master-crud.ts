// Factory untuk master data sederhana (hanya kolom `nama`): jenis & tujuan.
// Dipakai oleh /api/types dan /api/purposes agar aturannya persis sama:
// semua peran boleh membaca, hanya Admin yang boleh mengubah.

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { handle, requireUser, requireAdmin, HttpError } from "@/lib/guard";

export function makeMasterRoutes(
  // Drizzle tidak punya tipe generik yang nyaman untuk "tabel dengan kolom
  // id + nama", jadi dipakai `any` di satu tempat terpusat ini saja.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  key: string,
  label: string,
) {
  const GET = async () =>
    handle(async () => {
      await requireUser();
      const rows = await db
        .select({ id: table.id, nama: table.nama })
        .from(table)
        .orderBy(asc(table.id));
      return { [key]: rows };
    });

  const POST = async (req: Request) =>
    handle(async () => {
      await requireAdmin();
      const { nama } = await req.json();
      const name = String(nama ?? "").trim();
      if (!name) throw new HttpError(400, `Isi nama ${label} terlebih dahulu.`);

      const [exists] = await db
        .select({ id: table.id })
        .from(table)
        .where(eq(table.nama, name))
        .limit(1);
      if (exists) throw new HttpError(409, `${label} "${name}" sudah ada.`);

      const inserted = (await db.insert(table).values({ nama: name }).returning()) as Array<{
        id: number;
        nama: string;
      }>;
      const row = inserted[0];
      return { item: { id: row.id, nama: row.nama } };
    });

  const DELETE = async (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
    handle(async () => {
      await requireAdmin();
      const { id } = await ctx.params;
      const [row] = await db
        .select({ id: table.id, nama: table.nama })
        .from(table)
        .where(eq(table.id, Number(id)))
        .limit(1);
      if (!row) throw new HttpError(404, `${label} tidak ditemukan.`);
      await db.delete(table).where(eq(table.id, Number(id)));
      return { ok: true, nama: row.nama };
    });

  return { GET, POST, DELETE };
}
