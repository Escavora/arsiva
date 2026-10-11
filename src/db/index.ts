import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon lewat HTTP: tiap query adalah satu `fetch`, tanpa koneksi yang perlu
// dijaga. Ini cocok untuk Cloudflare Workers, yang tidak mengizinkan koneksi
// (WebSocket/Pool) dipakai lintas request. Konsekuensinya: tidak ada transaksi
// interaktif (`db.transaction`); pakai `db.batch` bila butuh atomik.

function buatDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL belum diisi di .env — isi dengan connection string Neon.");
  }
  return drizzle(neon(url), { schema });
}

type Db = ReturnType<typeof buatDb>;
let instance: Db | null = null;

/**
 * Klien dibuat saat PERTAMA kali dipakai, bukan saat modul dimuat.
 *
 * `next build` memuat setiap route untuk mengumpulkan konfigurasinya, padahal di
 * build Cloudflare `DATABASE_URL` belum ada (secret Worker baru tersedia saat
 * berjalan). Dengan proxy ini, mengimpor `db` tidak pernah gagal; error yang jelas
 * baru muncul bila query benar-benar dijalankan tanpa `DATABASE_URL`.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= buatDb();
    const nilai = Reflect.get(instance, prop, instance);
    return typeof nilai === "function" ? nilai.bind(instance) : nilai;
  },
});

export { schema };
