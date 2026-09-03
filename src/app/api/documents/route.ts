import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireWriter, HttpError } from "@/lib/guard";
import { docWith, mapDoc } from "@/lib/dto";
import { getStorage } from "@/lib/storage";

/** GET /api/documents — daftar seluruh dokumen (semua peran boleh membaca). */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.documents.findMany({
      with: docWith,
      orderBy: [desc(schema.documents.createdAt)],
    });
    return { docs: rows.map(mapDoc) };
  });
}

/** POST /api/documents — unggah dokumen baru (Admin & Staf Legal). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireWriter();
    const form = await req.formData();

    const nama = String(form.get("nama") ?? "").trim();
    const tanggalKadaluarsa = String(form.get("exp") ?? "").trim();
    const categoryId = numOrNull(form.get("categoryId"));
    const typeId = numOrNull(form.get("typeId"));
    const purposeId = numOrNull(form.get("purposeId"));
    const keterangan = String(form.get("ket") ?? "").trim();

    if (!nama) throw new HttpError(400, "Nama dokumen wajib diisi.");
    if (!categoryId) throw new HttpError(400, "Kategori wajib dipilih.");
    if (!typeId) throw new HttpError(400, "Jenis dokumen wajib dipilih.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalKadaluarsa)) {
      throw new HttpError(400, "Tanggal kadaluarsa tidak valid.");
    }

    // Berkas opsional — dokumen bisa didaftarkan dulu, scan menyusul.
    let stored: { key: string; fileName: string; size: number; mimeType: string } | null = null;
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      try {
        stored = await getStorage().put(file);
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : "Berkas gagal diunggah.");
      }
    }

    const [row] = await db
      .insert(schema.documents)
      .values({
        userId: user.id,
        categoryId,
        typeId,
        purposeId,
        namaDokumen: nama,
        keterangan,
        tanggalKadaluarsa,
        filePath: stored?.key ?? null,
        fileName: stored?.fileName ?? null,
        fileSize: stored?.size ?? null,
        mimeType: stored?.mimeType ?? null,
      })
      .returning();

    const full = await db.query.documents.findFirst({
      where: (d, { eq }) => eq(d.id, row.id),
      with: docWith,
    });
    return { doc: full ? mapDoc(full) : null };
  });
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return v == null || v === "" || Number.isNaN(n) ? null : n;
}
