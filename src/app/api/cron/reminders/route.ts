// Proses terjadwal pengingat kedaluwarsa (PRD §7).
//
// Memeriksa dokumen yang masuk ambang pengingat masing-masing pemilik, lalu
// mengirim notifikasi (email lewat adapter + notifikasi in-app) satu kali per
// dokumen. Jejaknya dicatat di `document_reminders.notified_at` agar tidak
// mengirim berulang.
//
// Dijadwalkan lewat Cron Triggers Cloudflare (lihat `triggers` di wrangler.jsonc
// dan handler `scheduled` di worker.mjs). Manual:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
//   …/api/cron/reminders?kering=1  → hanya menampilkan rencana, tanpa kirim/simpan
//
// Hemat subrequest: di Workers, tiap query (neon-http) dan tiap email adalah satu
// `fetch`, dan paket gratis membatasi 50 per eksekusi. Karena itu satu putaran
// memproses paling banyak BATAS_PER_PUTARAN dokumen (yang paling mendesak dulu),
// dan semua penulisan digabung dalam satu `db.batch`. Sisanya ditangani putaran
// berikutnya (cron berjalan beberapa kali per pagi).

import { db, schema } from "@/db";
import { emailHtml, getMailer } from "@/lib/notify";
import { fmt } from "@/lib/arsiva";
import { envUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/** 1 query baca + 1 batch tulis + 20 email = 22 subrequest, jauh di bawah 50. */
const BATAS_PER_PUTARAN = 20;
/** Resend paket gratis: 2 permintaan per detik. */
const JEDA_EMAIL_MS = 550;

function hariMenuju(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function jalankan(kering: boolean) {
  const docs = await db.query.documents.findMany({
    with: {
      pengunggah: { columns: { id: true, name: true, email: true, reminderThresholdDays: true, aktif: true } },
      reminders: true,
    },
  });

  const calon = docs
    .flatMap((d) => {
      if (d.status === "diproses") return [];
      const owner = d.pengunggah;
      if (!owner || owner.aktif === false) return [];
      const sisa = hariMenuju(d.tanggalKadaluarsa);
      if (sisa > (owner.reminderThresholdDays ?? 60)) return []; // belum masuk ambang
      if (d.reminders.some((r) => r.notifiedAt !== null)) return []; // sudah pernah diberi tahu
      return [{ d, owner, sisa }];
    })
    .sort((a, b) => a.sisa - b.sisa);

  const putaranIni = calon.slice(0, BATAS_PER_PUTARAN);
  const base = envUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
  const pesan = putaranIni.map(({ d, owner, sisa }) => {
    const judul =
      sisa < 0
        ? `Dokumen kedaluwarsa: ${d.namaDokumen}`
        : `Dokumen akan kedaluwarsa dalam ${sisa} hari: ${d.namaDokumen}`;
    const paragraf = [
      sisa < 0
        ? `Dokumen "${d.namaDokumen}" sudah melewati masa berlaku pada ${fmt(d.tanggalKadaluarsa)} (${Math.abs(sisa)} hari lalu).`
        : `Dokumen "${d.namaDokumen}" akan berakhir masa berlakunya pada ${fmt(d.tanggalKadaluarsa)}.`,
      "Silakan tindak lanjuti melalui halaman Pengingat Kedaluwarsa di ARSIVA.",
    ];
    return { d, owner, sisa, judul, paragraf };
  });

  const rincian = pesan.map(({ d, owner, sisa }) => ({ dokumen: d.namaDokumen, kepada: owner.email, sisaHari: sisa }));
  const ringkas = { diperiksa: docs.length, perluDiberiTahu: calon.length, ditunda: calon.length - putaranIni.length };
  if (kering || pesan.length === 0) {
    return { ...ringkas, kering, dikirim: 0, gagalEmail: 0, driver: getMailer().nama, rincian };
  }

  // Jejak dan notifikasi in-app disimpan LEBIH DULU, dalam satu batch: bila putaran
  // terputus di tengah pengiriman email, dokumen yang sama tidak dikirimi ulang.
  // (Kebijakan lama tetap: jejak dicatat walau email gagal.)
  const sekarang = new Date();
  await db.batch([
    db.insert(schema.documentReminders).values(pesan.map(({ d }) => ({ documentId: d.id, notifiedAt: sekarang }))),
    db.insert(schema.notifications).values(
      pesan.map(({ d, owner, judul, paragraf }) => ({
        userId: owner.id, documentId: d.id, judul, pesan: paragraf.join("\n\n"), tipe: "kadaluarsa" as const,
      })),
    ),
  ]);

  const driver = getMailer();
  let gagalEmail = 0;
  for (const [i, { owner, judul, paragraf }] of pesan.entries()) {
    if (i > 0 && driver.nama !== "log") await tunggu(JEDA_EMAIL_MS);
    try {
      await driver.send({
        to: owner.email,
        subject: judul,
        text: paragraf.join("\n\n"),
        html: emailHtml(judul, paragraf, { teks: "Buka Pengingat", url: `${base}/pengingat` }),
      });
    } catch (err) {
      gagalEmail++;
      console.error(`[arsiva:cron] gagal kirim ke ${owner.email}:`, err instanceof Error ? err.message : err);
    }
  }

  return { ...ringkas, kering, dikirim: pesan.length, gagalEmail, driver: driver.nama, rincian };
}

function sahkan(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  // Pemanggil (curl, atau handler `scheduled` di worker.mjs) wajib mengirim Bearer <CRON_SECRET>.
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!sahkan(req)) {
    return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  try {
    const kering = new URL(req.url).searchParams.get("kering") === "1";
    return Response.json(await jalankan(kering));
  } catch (err) {
    console.error("[arsiva:cron]", err);
    return Response.json({ error: "Gagal menjalankan pengingat." }, { status: 500 });
  }
}

export const POST = GET;
