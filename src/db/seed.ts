/**
 * Seed ARSIVA — mengisi database dengan data contoh yang sama persis dengan
 * tampilan Tahap 1, agar demo tetap identik setelah pindah ke database asli.
 *
 * Jalankan: npm run db:seed   (idempoten — aman diulang)
 */
import "../../scripts/load-env";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { auth } from "../lib/auth";
import {
  seedCats,
  seedDocs,
  seedNotaris,
  seedPurposes,
  seedSchedules,
  seedShares,
  seedTypes,
  seedUsers,
} from "../lib/arsiva";

const PASSWORD = "arsiva123";

async function main() {
  console.log("→ Menyemai database ARSIVA…");

  /* 1. Pengguna (lewat Better Auth agar kata sandi ter-hash) */
  const userIdByName = new Map<string, string>();
  for (const u of seedUsers) {
    const existing = await db.query.user.findFirst({ where: eq(schema.user.email, u.email) });
    let id = existing?.id;
    if (!id) {
      const res = await auth.api.signUpEmail({
        body: { email: u.email, password: PASSWORD, name: u.nama },
      });
      id = res.user.id;
    }
    // peran/unit/aktif bertanda input:false, jadi diset langsung di sini.
    await db
      .update(schema.user)
      .set({ peran: u.peran, unit: u.unit, aktif: u.aktif, name: u.nama })
      .where(eq(schema.user.id, id));
    userIdByName.set(u.nama, id);
  }
  console.log(`  ✓ ${seedUsers.length} pengguna (kata sandi semua: "${PASSWORD}")`);

  /* 2. Master data */
  const catId = new Map<string, number>();
  for (const c of seedCats) {
    const [row] = await db
      .insert(schema.categories)
      .values({ nama: c.nama, deskripsi: c.desk })
      .onConflictDoUpdate({ target: schema.categories.nama, set: { deskripsi: c.desk } })
      .returning();
    catId.set(c.nama, row.id);
  }

  const typeId = new Map<string, number>();
  for (const t of seedTypes) {
    const [row] = await db
      .insert(schema.documentTypes)
      .values({ nama: t })
      .onConflictDoUpdate({ target: schema.documentTypes.nama, set: { nama: t } })
      .returning();
    typeId.set(t, row.id);
  }

  const purposeId = new Map<string, number>();
  for (const p of seedPurposes) {
    const [row] = await db
      .insert(schema.purposes)
      .values({ nama: p })
      .onConflictDoUpdate({ target: schema.purposes.nama, set: { nama: p } })
      .returning();
    purposeId.set(p, row.id);
  }
  console.log(`  ✓ ${seedCats.length} kategori · ${seedTypes.length} jenis · ${seedPurposes.length} tujuan`);

  /* 3. Dokumen */
  const existingDocs = await db.query.documents.findMany();
  const docIdByIndex: number[] = [];
  if (existingDocs.length === 0) {
    for (const d of seedDocs) {
      const [row] = await db
        .insert(schema.documents)
        .values({
          userId: userIdByName.get(d.o) ?? userIdByName.values().next().value!,
          categoryId: catId.get(d.k) ?? null,
          typeId: typeId.get(d.j) ?? null,
          purposeId: purposeId.get(d.t) ?? null,
          namaDokumen: d.n,
          tanggalKadaluarsa: d.e,
          status: d.p ? "diproses" : "aktif",
          fileName: `scan-${d.e.replace(/-/g, "")}.pdf`,
          mimeType: "application/pdf",
          fileSize: Math.round(parseFloat(d.s.replace(",", ".")) * 1024 * 1024),
          createdAt: new Date(d.u + "T08:00:00"),
          updatedAt: new Date(d.u + "T08:00:00"),
        })
        .returning();
      docIdByIndex.push(row.id);
      if (d.p) {
        await db.insert(schema.documentReminders).values({
          documentId: row.id,
          processedAt: new Date(),
        });
      }
    }
    console.log(`  ✓ ${seedDocs.length} dokumen`);
  } else {
    existingDocs.forEach((d) => docIdByIndex.push(d.id));
    console.log(`  • ${existingDocs.length} dokumen sudah ada — dilewati`);
  }

  /* 4. Notaris + jadwal */
  const existingNotaris = await db.query.notaris.findMany();
  const notarisIdByIndex: number[] = [];
  if (existingNotaris.length === 0) {
    for (const n of seedNotaris) {
      const [row] = await db
        .insert(schema.notaris)
        .values({ nama: n.nama, kantor: n.kantor, email: n.email, noTelepon: n.tel })
        .returning();
      notarisIdByIndex.push(row.id);
    }
    for (const s of seedSchedules) {
      await db.insert(schema.schedules).values({
        notarisId: notarisIdByIndex[s.ni],
        agenda: s.agenda,
        tanggal: s.tgl,
        jam: s.jam,
        status: s.st,
      });
    }
    console.log(`  ✓ ${seedNotaris.length} notaris · ${seedSchedules.length} jadwal`);
  } else {
    existingNotaris.forEach((n) => notarisIdByIndex.push(n.id));
    console.log(`  • notaris sudah ada — dilewati`);
  }

  /* 5. Tautan berbagi */
  const existingShares = await db.query.documentShares.findMany();
  if (existingShares.length === 0 && docIdByIndex.length) {
    const admin = userIdByName.get("Rina Astuti") ?? null;
    for (const s of seedShares) {
      await db.insert(schema.documentShares).values({
        documentId: docIdByIndex[s.di],
        createdBy: admin,
        penerimaEmail: s.email,
        penerimaTipe: s.tipe,
        token: crypto.randomUUID().replace(/-/g, ""),
        expiresAt: new Date(s.exp + "T23:59:59"),
        revokedAt: s.revoked ? new Date(s.dibuat + "T12:00:00") : null,
        createdAt: new Date(s.dibuat + "T09:00:00"),
      });
    }
    console.log(`  ✓ ${seedShares.length} tautan berbagi`);
  } else {
    console.log(`  • tautan berbagi sudah ada — dilewati`);
  }

  console.log("\n✅ Selesai. Masuk dengan:");
  console.log(`   Admin      : rina.astuti@bank.co.id / ${PASSWORD}`);
  console.log(`   Staf Legal : dimas.prakoso@bank.co.id / ${PASSWORD}`);
  console.log(`   Pembaca    : agus.nugroho@bank.co.id / ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed gagal:", err);
    process.exit(1);
  });
