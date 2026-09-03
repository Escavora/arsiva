import { randomBytes } from "node:crypto";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, requireUser, requireWriter, HttpError } from "@/lib/guard";
import { notify, emailHtml } from "@/lib/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapShare(s: {
  id: number;
  documentId: number;
  penerimaEmail: string;
  penerimaTipe: string;
  token: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  dokumen?: { namaDokumen: string } | null;
}) {
  const now = Date.now();
  const status = s.revokedAt ? "Dicabut" : s.expiresAt.getTime() < now ? "Kadaluarsa" : "Aktif";
  return {
    id: s.id,
    documentId: s.documentId,
    doc: s.dokumen?.namaDokumen ?? "—",
    email: s.penerimaEmail,
    tipe: s.penerimaTipe,
    token: s.token,
    exp: s.expiresAt.toISOString(),
    dibuat: s.createdAt.toISOString(),
    status,
    bisaCabut: status === "Aktif",
  };
}

/** GET /api/shares — riwayat tautan berbagi. */
export async function GET() {
  return handle(async () => {
    await requireUser();
    const rows = await db.query.documentShares.findMany({
      orderBy: [desc(schema.documentShares.createdAt)],
      with: { dokumen: { columns: { namaDokumen: true } } },
    });
    return { shares: rows.map(mapShare) };
  });
}

/** POST /api/shares — buat tautan aman (Admin & Staf Legal). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireWriter();
    const { documentId, email, tipe, hari } = await req.json();

    const mail = String(email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) throw new HttpError(400, "Email penerima tidak valid.");
    if (tipe !== "Notaris" && tipe !== "Rekanan") {
      throw new HttpError(400, "Tipe penerima harus Notaris atau Rekanan.");
    }
    const days = Number(hari);
    if (![3, 7, 14, 30].includes(days)) throw new HttpError(400, "Masa berlaku tautan tidak valid.");

    const doc = await db.query.documents.findFirst({
      where: (d, { eq }) => eq(d.id, Number(documentId)),
    });
    if (!doc) throw new HttpError(404, "Dokumen tidak ditemukan.");

    // Token acak 256-bit — tidak bisa ditebak.
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + days * 86400_000);

    const [row] = await db
      .insert(schema.documentShares)
      .values({
        documentId: doc.id,
        createdBy: user.id,
        penerimaEmail: mail,
        penerimaTipe: tipe,
        token,
        expiresAt,
      })
      .returning();

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = `${base}/s/${token}`;
    const berlaku = expiresAt.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const judul = `Dokumen dibagikan: ${doc.namaDokumen}`;
    const paragraf = [
      `${user.name} dari Divisi Legal membagikan sebuah dokumen kepada Anda.`,
      `Dokumen: "${doc.namaDokumen}".`,
      `Tautan ini bersifat pribadi dan berlaku sampai ${berlaku} (${days} hari), setelah itu otomatis tidak dapat dibuka lagi.`,
    ];

    const kirim = await notify({
      userId: user.id,
      email: mail,
      judul,
      pesan: `${paragraf.join("\n\n")}\n\nBuka dokumen: ${url}`,
      html: emailHtml(judul, paragraf, { teks: "Buka Dokumen", url }),
      // Notifikasi in-app ditujukan untuk pembuat tautan, jadi teksnya berbeda.
      inApp: {
        judul: `Tautan dibagikan ke ${mail}`,
        pesan: `Dokumen "${doc.namaDokumen}" dibagikan ke ${mail} (${tipe}). Berlaku sampai ${berlaku}.\nTautan: ${url}`,
      },
      tipe: "berbagi",
      documentId: doc.id,
    });

    const full = await db.query.documentShares.findFirst({
      where: (s, { eq }) => eq(s.id, row.id),
      with: { dokumen: { columns: { namaDokumen: true } } },
    });
    return { share: full ? mapShare(full) : null, url, email: kirim };
  });
}
