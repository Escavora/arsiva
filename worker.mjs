// Worker entry ARSIVA untuk Cloudflare.
//
// `.open-next/worker.js` (hasil `opennextjs-cloudflare build`) hanya punya handler
// `fetch`. Berkas ini membungkusnya dan menambah handler `scheduled` untuk Cron
// Triggers (jadwal ada di `triggers.crons` pada wrangler.jsonc).
//
// Handler `scheduled` memanggil route /api/cron/reminders di dalam worker yang
// sama — tanpa lewat jaringan publik — dengan header Bearer CRON_SECRET, sehingga
// logika pengingat tetap satu tempat dan tetap bisa dipanggil manual lewat HTTP.
//
// Sengaja JavaScript, bukan TypeScript: berkas yang diimpor baru ada setelah build,
// jadi `tsc` pada repo yang belum di-build akan gagal bila berkas ini ikut diperiksa.
// Wrangler yang membundelnya saat deploy/preview.

import worker from "./.open-next/worker.js";

// Kelas Durable Object yang diekspor OpenNext ikut diteruskan agar binding-nya
// tetap bisa dipakai bila kelak diaktifkan (sekarang belum ada yang terikat).
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

const arsivaWorker = {
  fetch: worker.fetch,

  /**
   * @param {{ cron: string, scheduledTime: number }} controller
   * @param {Record<string, string | undefined>} env
   * @param {{ waitUntil(p: Promise<unknown>): void }} ctx
   */
  async scheduled(controller, env, ctx) {
    if (!env.CRON_SECRET) {
      // Gagal keras supaya terlihat sebagai eksekusi gagal di dasbor Cloudflare.
      throw new Error("[arsiva:cron] CRON_SECRET belum diisi sebagai secret Worker.");
    }
    const base = env.NEXT_PUBLIC_APP_URL || "https://arsiva.internal";
    const url = new URL("/api/cron/reminders", base);
    // CRON_KERING=1 → putaran uji: hanya menghitung rencana, tanpa kirim/simpan.
    if (env.CRON_KERING === "1") url.searchParams.set("kering", "1");
    const req = new Request(url, {
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        // Wajib: tanpa header Host, routing OpenNext menganggap URL ini "eksternal"
        // (host URL ≠ header host) dan meneruskannya lewat jaringan, bukan diproses
        // di worker ini sendiri.
        Host: url.host,
      },
    });
    const res = await worker.fetch(req, env, ctx);
    const isi = await res.text();
    if (!res.ok) {
      throw new Error(`[arsiva:cron] ${controller.cron} → ${res.status}: ${isi.slice(0, 300)}`);
    }
    console.log(`[arsiva:cron] ${controller.cron} → ${isi.slice(0, 500)}`);
  },
};

export default arsivaWorker;
