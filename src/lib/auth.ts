// Better Auth — sumber kebenaran untuk identitas & peran pengguna.
//
// PENTING (keamanan): peran diambil dari sesi di server, bukan dari klien.
// Semua pengecekan hak akses di API memakai `requireUser`/`requireAdmin` di
// src/lib/guard.ts, bukan nilai apa pun yang dikirim browser.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Tahap 2 belum memakai verifikasi email (driver email masih "log").
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // Kolom tambahan ARSIVA agar ikut terbawa di objek session.user
  user: {
    additionalFields: {
      peran: { type: "string", required: false, input: false, defaultValue: "Staf Legal" },
      unit: { type: "string", required: false, input: false, defaultValue: "Divisi Legal" },
      aktif: { type: "boolean", required: false, input: false, defaultValue: true },
      reminderThresholdDays: { type: "number", required: false, input: false, defaultValue: 60 },
    },
  },

  session: {
    // PRD: sesi berakhir otomatis setelah 30 menit tanpa aktivitas.
    expiresIn: 60 * 30,
    updateAge: 60 * 5,
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // Wajib paling akhir: menjahit cookie ke Next.js server actions/route handlers.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];
