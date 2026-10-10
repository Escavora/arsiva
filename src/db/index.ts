import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon lewat HTTP: tiap query adalah satu `fetch`, tanpa koneksi yang perlu
// dijaga. Ini cocok untuk Cloudflare Workers, yang tidak mengizinkan koneksi
// (WebSocket/Pool) dipakai lintas request. Konsekuensinya: tidak ada transaksi
// interaktif (`db.transaction`); pakai `db.batch` bila butuh atomik.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL belum diisi di .env — isi dengan connection string Neon.");
}

export const db = drizzle(neon(url), { schema });
export { schema };
