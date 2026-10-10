/**
 * Ganti kata sandi akun demo bawaan seed dengan frasa sandi acak yang baru.
 *
 * Hanya menyentuh akun yang emailnya ada di seedUsers DAN masih terdaftar di
 * database; akun lain yang dibuat lewat halaman Akses tidak diubah. Kata sandi
 * baru dicetak SEKALI ke terminal dan tidak disimpan di mana pun.
 *
 * Jalankan: npm run sandi:demo
 */
import "./load-env";
import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { db, schema } from "../src/db";
import { seedUsers } from "../src/lib/arsiva";
import { frasaSandi } from "./frasa-sandi";

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY belum diisi di .env.");
  const clerk = createClerkClient({ secretKey });

  const hasil: { peran: string; email: string; sandi: string }[] = [];
  for (const u of seedUsers) {
    const email = u.email.toLowerCase();
    const lokal = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
    if (!lokal?.clerkId) {
      console.log(`  • ${email} tidak ada di database — dilewati`);
      continue;
    }
    const sandi = frasaSandi();
    // Tanpa skipPasswordChecks: frasa sandi acak harus lolos pemeriksaan Clerk (termasuk daftar sandi bocor).
    await clerk.users.updateUser(lokal.clerkId, { password: sandi, signOutOfOtherSessions: true });
    hasil.push({ peran: lokal.peran, email, sandi });
  }

  console.log("\n✅ Kata sandi baru (catat sekarang; tidak disimpan di mana pun):\n");
  for (const h of hasil) console.log(`   ${h.peran.padEnd(12)} ${h.email.padEnd(28)} ${h.sandi}`);
  console.log("\n   Sesi lama akun-akun ini sudah dikeluarkan.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✖ Gagal mengganti kata sandi:", err?.errors?.[0]?.longMessage ?? err);
    process.exit(1);
  });
