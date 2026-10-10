// Penjaga hak akses sisi server.
//
// Ini adalah batas keamanan yang sebenarnya. Identitas berasal dari sesi
// Clerk, tetapi peran dan status aktif SELALU dibaca dari tabel `user` lokal di
// server — tidak pernah dari body/header/query yang dikirim klien. Pengecekan
// `isAdmin` di komponen React hanya untuk UX (menyembunyikan menu).

import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { BATAS_IDLE_MS, type Role } from "@/lib/arsiva";

export type AppUser = typeof schema.user.$inferSelect;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Catat aktivitas paling sering sekali per menit, agar tidak menulis di tiap request. */
const JEDA_CATAT_MS = 60 * 1000;

/** Cari profil lokal dari ID Clerk; tautkan otomatis lewat email terverifikasi bila belum ditautkan. */
async function profilDariClerk(clerkId: string): Promise<AppUser | null> {
  const ada = await db.query.user.findFirst({ where: eq(schema.user.clerkId, clerkId) });
  if (ada) return ada;

  // Akun lokal yang dibuat sebelum ditautkan (mis. hasil seed lama): cocokkan
  // lewat email, tetapi HANYA bila email di Clerk sudah terverifikasi.
  const clerk = await clerkClient();
  const u = await clerk.users.getUser(clerkId);
  const email = u.primaryEmailAddress;
  if (!email || email.verification?.status !== "verified") return null;

  const lokal = await db.query.user.findFirst({
    where: eq(schema.user.email, email.emailAddress.toLowerCase()),
  });
  if (!lokal || lokal.clerkId) return null;

  const [row] = await db
    .update(schema.user)
    .set({ clerkId, updatedAt: new Date() })
    .where(eq(schema.user.id, lokal.id))
    .returning();
  return row ?? null;
}

/**
 * Ambil pengguna dari sesi, atau null bila belum login.
 *
 * Sekaligus menegakkan batas idle: bila sesi yang sama sudah diam lebih dari
 * 30 menit, sesi Clerk dicabut dan request ditolak.
 */
export async function getSessionUser(): Promise<AppUser | null> {
  const { userId, sessionId } = await auth();
  if (!userId || !sessionId) return null;

  const profil = await profilDariClerk(userId);
  if (!profil) {
    throw new HttpError(403, "Akun Anda belum terdaftar di ARSIVA. Hubungi Admin.");
  }

  const sekarang = Date.now();
  // Sesi baru (ID berbeda dari yang terakhir tercatat) dimulai dari nol; tanpa
  // ini, login pertama hari ini dinilai "idle" sejak aktivitas kemarin.
  const sesiSama = profil.lastSessionId === sessionId;
  const terakhir = profil.lastActiveAt?.getTime() ?? 0;

  if (sesiSama && sekarang - terakhir > BATAS_IDLE_MS) {
    try {
      const clerk = await clerkClient();
      await clerk.sessions.revokeSession(sessionId);
    } catch (err) {
      console.error("[arsiva:auth] gagal mencabut sesi idle:", err);
    }
    throw new HttpError(401, "Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan masuk kembali.");
  }

  if (!sesiSama || sekarang - terakhir > JEDA_CATAT_MS) {
    const [row] = await db
      .update(schema.user)
      .set({ lastActiveAt: new Date(sekarang), lastSessionId: sessionId })
      .where(eq(schema.user.id, profil.id))
      .returning();
    return row ?? profil;
  }
  return profil;
}

/** Wajib login. Melempar 401 bila tidak, 403 bila akun dinonaktifkan. */
export async function requireUser(): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Anda harus masuk terlebih dahulu.");
  if (user.aktif === false) throw new HttpError(403, "Akun Anda dinonaktifkan. Hubungi Admin.");
  return user;
}

/** Wajib salah satu peran. */
export async function requireRole(...roles: Role[]): Promise<AppUser> {
  const user = await requireUser();
  if (!roles.includes(user.peran as Role)) {
    throw new HttpError(403, "Anda tidak memiliki wewenang untuk tindakan ini.");
  }
  return user;
}

/** Wajib Admin — untuk master data & manajemen pengguna. */
export async function requireAdmin(): Promise<AppUser> {
  return requireRole("Admin");
}

/** Boleh menulis dokumen: Admin & Team Member (Pembaca hanya membaca). */
export async function requireWriter(): Promise<AppUser> {
  return requireRole("Admin", "Team Member");
}

/** Bungkus handler route agar HttpError otomatis jadi respons JSON yang rapi. */
export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return Response.json(data ?? { ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("[arsiva:api]", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    return Response.json({ error: message }, { status: 500 });
  }
}
