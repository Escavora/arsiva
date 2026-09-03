// Penjaga hak akses sisi server.
//
// Ini adalah batas keamanan yang sebenarnya. Peran SELALU dibaca dari sesi
// Better Auth di server — tidak pernah dari body/header/query yang dikirim klien.
// Pengecekan `isAdmin` di komponen React hanya untuk UX (menyembunyikan menu).

import { headers } from "next/headers";
import { auth, type AuthUser } from "@/lib/auth";
import type { Role } from "@/lib/arsiva";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Ambil pengguna dari sesi, atau null bila belum login. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Wajib login. Melempar 401 bila tidak, 403 bila akun dinonaktifkan. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Anda harus masuk terlebih dahulu.");
  if (user.aktif === false) throw new HttpError(403, "Akun Anda dinonaktifkan. Hubungi Admin.");
  return user;
}

/** Wajib salah satu peran. */
export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.peran as Role)) {
    throw new HttpError(403, "Anda tidak memiliki wewenang untuk tindakan ini.");
  }
  return user;
}

/** Wajib Admin — untuk master data & manajemen pengguna. */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("Admin");
}

/** Boleh menulis dokumen: Admin & Team Member (Pembaca hanya membaca). */
export async function requireWriter(): Promise<AuthUser> {
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
