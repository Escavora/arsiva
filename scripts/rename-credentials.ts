/**
 * Perubahan kredensial demo satu-kali:
 *   - Peran "Staf Legal" → "Team Member" (untuk seluruh pengguna yang masih memakainya)
 *   - Email Admin  : rina.astuti@bank.co.id  → admin.cop@bri.co.id
 *   - Email Team Member : dimas.prakoso@bank.co.id → teammember.cop@bri.co.id
 *
 * Sengaja MENGUBAH baris pengguna yang sudah ada (bukan membuat akun baru),
 * supaya dokumen yang sudah dimiliki (documents.user_id) tetap terhubung ke
 * pengguna yang sama. Idempoten — aman dijalankan ulang.
 *
 * Jalankan: npx tsx scripts/rename-credentials.ts
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

async function main() {
  console.log("→ Memperbarui kredensial pengguna…");

  const direname = await db
    .update(schema.user)
    .set({ peran: "Team Member" })
    .where(eq(schema.user.peran, "Staf Legal" as "Team Member"))
    .returning({ id: schema.user.id, email: schema.user.email });
  console.log(`  ✓ ${direname.length} pengguna diubah perannya menjadi "Team Member"`);

  const admin = await db.query.user.findFirst({ where: eq(schema.user.email, "rina.astuti@bank.co.id") });
  if (admin) {
    await db.update(schema.user).set({ email: "admin.cop@bri.co.id" }).where(eq(schema.user.id, admin.id));
    console.log("  ✓ Email Admin diubah menjadi admin.cop@bri.co.id");
  } else {
    console.log("  • rina.astuti@bank.co.id tidak ditemukan — dilewati (mungkin sudah diubah sebelumnya)");
  }

  const teamMember = await db.query.user.findFirst({ where: eq(schema.user.email, "dimas.prakoso@bank.co.id") });
  if (teamMember) {
    await db.update(schema.user).set({ email: "teammember.cop@bri.co.id" }).where(eq(schema.user.id, teamMember.id));
    console.log("  ✓ Email Team Member diubah menjadi teammember.cop@bri.co.id");
  } else {
    console.log("  • dimas.prakoso@bank.co.id tidak ditemukan — dilewati (mungkin sudah diubah sebelumnya)");
  }

  console.log("\n✅ Selesai.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gagal:", err);
    process.exit(1);
  });
