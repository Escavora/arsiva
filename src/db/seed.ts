/**
 * Seed ARSIVA — mengisi database dengan data contoh yang sama persis dengan
 * tampilan Tahap 1, agar demo tetap identik setelah pindah ke database asli.
 *
 * Jalankan: npm run db:seed   (idempoten — aman diulang)
 */
import "../../scripts/load-env";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { createClerkClient } from "@clerk/backend";
import { frasaSandi } from "../../scripts/frasa-sandi";
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

async function main() {
  console.log("→ Menyemai database ARSIVA…");

  /* 1. Pengguna: akun di Clerk (menyimpan kata sandi) + profil lokal yang ditautkan lewat clerk_id */
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY belum diisi di .env.");
  const clerk = createClerkClient({ secretKey });

  const userIdByName = new Map<string, string>();
  // Kata sandi akun yang BARU dibuat; dicetak sekali di akhir, tidak disimpan.
  const sandiBaru: { peran: string; email: string; sandi: string }[] = [];
  for (const u of seedUsers) {
    const email = u.email.toLowerCase();
    const [firstName, ...sisa] = u.nama.split(" ");
    const lastName = sisa.join(" ") || undefined;

    const lokal = await db.query.user.findFirst({ where: eq(schema.user.email, email) });

    // Akun Clerk: pakai yang sudah ditautkan, lalu cari lewat email, baru buat.
    let clerkId = lokal?.clerkId ?? undefined;
    if (!clerkId) {
      const { data } = await clerk.users.getUserList({ emailAddress: [email] });
      clerkId = data[0]?.id;
    }
    if (!clerkId) {
      // Frasa sandi acak per akun; harus lolos pemeriksaan Clerk (tanpa skipPasswordChecks).
      const sandi = frasaSandi();
      const baru = await clerk.users.createUser({ emailAddress: [email], password: sandi, firstName, lastName });
      clerkId = baru.id;
      sandiBaru.push({ peran: u.peran, email, sandi });
    }

    // Akun nonaktif diblokir juga di Clerk (selain dicek lokal di guard.ts).
    if (!u.aktif) await clerk.users.banUser(clerkId);

    const nilai = { clerkId, name: u.nama, email, unit: u.unit, peran: u.peran, aktif: u.aktif };
    let id = lokal?.id;
    if (id) {
      await db.update(schema.user).set(nilai).where(eq(schema.user.id, id));
    } else {
      const [row] = await db.insert(schema.user).values(nilai).returning();
      id = row.id;
    }
    userIdByName.set(u.nama, id);
  }
  console.log(`  ✓ ${seedUsers.length} pengguna (${sandiBaru.length} akun baru di Clerk)`);

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

  console.log("\n✅ Selesai.");
  if (sandiBaru.length) {
    console.log("\n   Kata sandi akun baru (catat sekarang; tidak disimpan di mana pun):");
    for (const a of sandiBaru) console.log(`   ${a.peran.padEnd(12)} ${a.email.padEnd(28)} ${a.sandi}`);
  } else {
    console.log("   Semua akun sudah ada; kata sandinya tidak diubah. Untuk mengganti: npm run sandi:demo");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed gagal:", err);
    process.exit(1);
  });
