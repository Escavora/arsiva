import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/arsiva.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// SQLite lokal (dialect "sqlite") dan Turso jarak jauh (dialect "turso",
// menerima authToken) memakai bentuk config yang berbeda di drizzle-kit —
// dipilih otomatis dari skema URL-nya.
const isRemote = url.startsWith("libsql:") || url.startsWith("https:");

export default defineConfig(
  isRemote
    ? {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: { url, authToken },
        verbose: true,
        strict: true,
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: { url },
        verbose: true,
        strict: true,
      },
);
