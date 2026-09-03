import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/arsiva.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// libsql tidak membuat folder induk sendiri — pastikan ada agar tidak error 14.
// Hanya berlaku untuk file lokal; Turso (libsql://…) tidak punya folder lokal.
if (url.startsWith("file:")) {
  try {
    mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
  } catch {
    // sudah ada / tidak bisa dibuat — biarkan client yang melapor
  }
}

if ((url.startsWith("libsql:") || url.startsWith("https:")) && !authToken) {
  console.warn(
    "[arsiva:db] DATABASE_URL mengarah ke server jarak jauh (Turso) tetapi " +
      "DATABASE_AUTH_TOKEN belum diisi — koneksi kemungkinan akan ditolak.",
  );
}

// Satu koneksi dipakai ulang antar hot-reload agar tidak membuka file berkali-kali.
const globalForDb = globalThis as unknown as {
  __arsivaClient?: ReturnType<typeof createClient>;
};

const client = globalForDb.__arsivaClient ?? createClient({ url, authToken });
if (process.env.NODE_ENV !== "production") globalForDb.__arsivaClient = client;

export const db = drizzle(client, { schema });
export { schema };
