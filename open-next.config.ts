import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Belum memakai incremental cache R2: hampir semua halaman ARSIVA dinamis
// (bergantung sesi), jadi cache ISR belum dibutuhkan.
export default defineCloudflareConfig({});
