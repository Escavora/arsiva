/**
 * Memuat .env SEBELUM modul lain dimuat.
 *
 * Pernyataan `import` dieksekusi lebih dulu daripada baris kode biasa, jadi
 * memanggil process.loadEnvFile() di badan skrip TERLAMBAT untuk modul yang
 * membaca process.env saat dimuat (mis. DATABASE_URL, BETTER_AUTH_SECRET).
 * Karena itu file ini diimpor paling atas sebagai efek samping:
 *
 *   import "./load-env";
 *   import { sesuatu } from "../src/...";
 */
try {
  process.loadEnvFile(".env");
} catch {
  // .env boleh tidak ada — nilai bawaan di kode yang dipakai.
}
