import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diisi di .env.");

// Migrasi sebaiknya lewat koneksi langsung, bukan lewat pooler (PgBouncer mode
// transaksi). Di Neon, host langsung = host pooler tanpa akhiran "-pooler".
const directUrl = process.env.DATABASE_URL_UNPOOLED ?? url.replace("-pooler.", ".");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: directUrl },
  verbose: true,
  strict: true,
});
