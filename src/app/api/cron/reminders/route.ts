// Proses terjadwal pengingat kadaluarsa (PRD §7).
//
// Memeriksa dokumen yang masuk ambang pengingat masing-masing pemilik, lalu
// mengirim notifikasi (email lewat adapter + notifikasi in-app) satu kali per
// dokumen. Jejaknya dicatat di `document_reminders.notified_at` agar tidak
// mengirim berulang.
//
// Cara memanggil:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
// Di Vercel, jadwalkan lewat vercel.json (lihat README).

import { db, schema } from "@/db";
import { notify, emailHtml, getMailer } from "@/lib/notify";
import { fmt } from "@/lib/arsiva";
import { envUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

function hariMenuju(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

async function jalankan() {
  const docs = await db.query.documents.findMany({
    with: {
      pengunggah: { columns: { id: true, name: true, email: true, reminderThresholdDays: true, aktif: true } },
      reminders: true,
    },
  });

  let dikirim = 0;
  let gagalEmail = 0;
  const rincian: { dokumen: string; kepada: string; sisaHari: number }[] = [];

  for (const d of docs) {
    if (d.status === "diproses") continue;
    const owner = d.pengunggah;
    if (!owner || owner.aktif === false) continue;

    const sisa = hariMenuju(d.tanggalKadaluarsa);
    const ambang = owner.reminderThresholdDays ?? 60;
    if (sisa > ambang) continue; // belum masuk ambang

    // Sudah pernah diberi tahu? (baris reminder dengan notified_at terisi)
    const sudah = d.reminders.some((r) => r.notifiedAt !== null);
    if (sudah) continue;

    const judul =
      sisa < 0
        ? `Dokumen kadaluarsa: ${d.namaDokumen}`
        : `Dokumen akan kadaluarsa dalam ${sisa} hari: ${d.namaDokumen}`;
    const paragraf = [
      sisa < 0
        ? `Dokumen "${d.namaDokumen}" sudah melewati masa berlaku pada ${fmt(d.tanggalKadaluarsa)} (${Math.abs(sisa)} hari lalu).`
        : `Dokumen "${d.namaDokumen}" akan berakhir masa berlakunya pada ${fmt(d.tanggalKadaluarsa)}.`,
      "Silakan tindak lanjuti melalui halaman Pengingat Kadaluarsa di ARSIVA.",
    ];
    const base = envUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000");

    const kirim = await notify({
      userId: owner.id,
      email: owner.email,
      judul,
      pesan: paragraf.join("\n\n"),
      html: emailHtml(judul, paragraf, { teks: "Buka Pengingat", url: `${base}/pengingat` }),
      tipe: "kadaluarsa",
      documentId: d.id,
    });

    // Jejak dicatat walau email gagal, supaya tidak dikirim berulang tiap jam.
    await db.insert(schema.documentReminders).values({
      documentId: d.id,
      notifiedAt: new Date(),
    });

    dikirim++;
    if (!kirim.terkirim) gagalEmail++;
    rincian.push({ dokumen: d.namaDokumen, kepada: owner.email, sisaHari: sisa });
  }

  return { diperiksa: docs.length, dikirim, gagalEmail, driver: getMailer().nama, rincian };
}

function sahkan(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  // Vercel Cron mengirim header ini; lokal bisa pakai Bearer manual.
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!sahkan(req)) {
    return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  try {
    return Response.json(await jalankan());
  } catch (err) {
    console.error("[arsiva:cron]", err);
    return Response.json({ error: "Gagal menjalankan pengingat." }, { status: 500 });
  }
}

export const POST = GET;
