/**
 * Kosongkan database Postgres (Neon): hapus semua tabel aplikasi dan riwayat
 * migrasi Drizzle. Setelahnya jalankan migrasi + seed — `npm run db:reset`
 * melakukan ketiganya berurutan.
 *
 * MENGHAPUS SEMUA DATA. Hanya untuk database pengembangan/demo.
 */
import "./load-env";
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi di .env.");

  const host = new URL(url).host;
  console.log(`→ Mengosongkan database di ${host}…`);

  const sql = neon(url);
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  console.log("  ✓ Schema public dan riwayat migrasi dihapus");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset gagal:", err);
    process.exit(1);
  });
