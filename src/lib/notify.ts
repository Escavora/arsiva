// Adapter email + notifikasi in-app.
//
// Driver dipilih lewat EMAIL_DRIVER di .env:
//   log    → dicetak ke console server (pengembangan, tanpa kredensial)
//   resend → dikirim sungguhan lewat Resend HTTP API (butuh RESEND_API_KEY)
//   smtp   → dikirim sungguhan lewat SMTP/Nodemailer (butuh SMTP_HOST dst.)
//
// PENTING: pengiriman email sengaja dibuat TIDAK mematikan alur bisnis. Kalau
// email gagal (kredensial salah, layanan mati), tautan/pengingat tetap tersimpan
// dan pemanggil diberi tahu lewat nilai balik `terkirim: false` + `error`.

import { db, schema } from "@/db";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface EmailDriver {
  nama: string;
  send(mail: Mail): Promise<void>;
}

function from(): string {
  return process.env.EMAIL_FROM || "ARSIVA <no-reply@arsiva.local>";
}

/* ───────────────────────── Driver: log ───────────────────────── */

const logDriver: EmailDriver = {
  nama: "log",
  async send({ to, subject, text }) {
    console.info(
      `\n[arsiva:email] ──────────────────────────────\n` +
        `  Kepada : ${to}\n` +
        `  Perihal: ${subject}\n` +
        `  ${text.replace(/\n/g, "\n  ")}\n` +
        `──────────────────────────────────────────────\n`,
    );
  },
};

/* ───────────────────────── Driver: Resend ───────────────────────── */
// Memakai HTTP API langsung agar tidak menambah dependensi.

const resendDriver: EmailDriver = {
  nama: "resend",
  async send({ to, subject, text, html }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY belum diisi di .env — email tidak dapat dikirim.");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: from(), to: [to], subject, text, html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend menolak permintaan (${res.status}): ${detail.slice(0, 300)}`);
    }
  },
};

/* ───────────────────────── Driver: SMTP ───────────────────────── */

let transporter: import("nodemailer").Transporter | null = null;

const smtpDriver: EmailDriver = {
  nama: "smtp",
  async send({ to, subject, text, html }) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      throw new Error("SMTP_HOST/SMTP_USER/SMTP_PASS belum lengkap di .env.");
    }
    if (!transporter) {
      const nodemailer = await import("nodemailer");
      const port = Number(process.env.SMTP_PORT ?? 587);
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 465 = SMTPS; 587 = STARTTLS
        auth: { user, pass },
      });
    }
    await transporter.sendMail({ from: from(), to, subject, text, html });
  },
};

/* ───────────────────────── Pemilihan driver ───────────────────────── */

/**
 * Driver dipilih SETIAP KALI dipakai, bukan sekali saat modul dimuat.
 *
 * Ini penting: pada skrip Node, pernyataan `import` dijalankan sebelum
 * `process.loadEnvFile()`, sehingga pemilihan saat modul dimuat akan selalu
 * membaca EMAIL_DRIVER yang masih kosong dan diam-diam jatuh ke driver "log".
 */
export function getMailer(): EmailDriver {
  switch (process.env.EMAIL_DRIVER ?? "log") {
    case "resend":
      return resendDriver;
    case "smtp":
      return smtpDriver;
    case "log":
      return logDriver;
    default:
      console.warn(`[arsiva:email] driver tidak dikenal, memakai "log".`);
      return logDriver;
  }
}

/* ───────────────────────── Template HTML ───────────────────────── */

/** Membungkus isi pesan dalam kerangka email sederhana yang aman di semua klien. */
export function emailHtml(judul: string, paragraf: string[], tombol?: { teks: string; url: string }): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = paragraf
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6;color:#333">${esc(p)}</p>`)
    .join("");
  const cta = tombol
    ? `<p style="margin:22px 0 14px">
         <a href="${tombol.url}" style="display:inline-block;padding:11px 20px;border-radius:8px;background:#256093;color:#fff;text-decoration:none;font-weight:600">${esc(tombol.teks)}</a>
       </p>
       <p style="margin:0 0 14px;font-size:12px;color:#777;word-break:break-all">Bila tombol tidak berfungsi, salin tautan ini: ${esc(tombol.url)}</p>`
    : "";

  return `<!doctype html><html lang="id"><body style="margin:0;padding:24px;background:#f4f6f9;font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e3e8ef">
    <div style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#75798c;margin-bottom:6px">ARSIVA · Arsip Dokumen Legal</div>
    <h1 style="margin:0 0 16px;font-size:19px;color:#101827">${esc(judul)}</h1>
    ${body}${cta}
    <hr style="border:0;border-top:1px solid #e3e8ef;margin:22px 0 14px">
    <p style="margin:0;font-size:11.5px;color:#8b90a0">Email otomatis — mohon tidak dibalas. Seluruh aktivitas dicatat pada audit log ARSIVA.</p>
  </div></body></html>`;
}

/* ───────────────────────── API notifikasi ───────────────────────── */

export type HasilKirim = { terkirim: boolean; driver: string; error?: string };

/** Simpan notifikasi in-app untuk seorang pengguna. */
export async function notifyInApp(input: {
  userId: string;
  judul: string;
  pesan: string;
  tipe?: "kadaluarsa" | "berbagi" | "sistem";
  documentId?: number | null;
}) {
  await db.insert(schema.notifications).values({
    userId: input.userId,
    judul: input.judul,
    pesan: input.pesan,
    tipe: input.tipe ?? "sistem",
    documentId: input.documentId ?? null,
  });
}

/**
 * Kirim email + catat notifikasi in-app.
 *
 * Email dikirim ke `email` (bisa pihak eksternal), sedangkan notifikasi in-app
 * disimpan untuk `userId` (pengguna ARSIVA) — keduanya boleh berbeda, itu
 * sebabnya teksnya dipisah lewat `inApp`.
 *
 * Tidak pernah melempar error: kegagalan email dilaporkan lewat nilai balik.
 */
export async function notify(input: {
  userId: string;
  email: string;
  judul: string;
  pesan: string;
  html?: string;
  inApp?: { judul: string; pesan: string };
  tipe?: "kadaluarsa" | "berbagi" | "sistem";
  documentId?: number | null;
}): Promise<HasilKirim> {
  const driver = getMailer();
  const hasil: HasilKirim = { terkirim: false, driver: driver.nama };

  try {
    await driver.send({
      to: input.email,
      subject: input.judul,
      text: input.pesan,
      html: input.html,
    });
    hasil.terkirim = true;
  } catch (err) {
    hasil.error = err instanceof Error ? err.message : "Gagal mengirim email.";
    console.error(`[arsiva:email] gagal kirim ke ${input.email}:`, hasil.error);
  }

  // Notifikasi in-app tetap dicatat walau email gagal, agar jejaknya tidak hilang.
  await notifyInApp({
    userId: input.userId,
    judul: input.inApp?.judul ?? input.judul,
    pesan: input.inApp?.pesan ?? input.pesan,
    tipe: input.tipe,
    documentId: input.documentId,
  });

  return hasil;
}
