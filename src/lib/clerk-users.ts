// Pembantu untuk mengelola akun di Clerk lewat Backend API (hanya di server).
//
// Admin menambah/mengubah/menghapus pengguna dari halaman Akses; akun Clerk dan
// baris profil lokal (tabel `user`) selalu diubah bersamaan oleh route terkait.

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { HttpError } from "@/lib/guard";
import { kodeClerk, pesanClerk } from "@/lib/pesan-clerk";

/** "Rina Astuti" → { firstName: "Rina", lastName: "Astuti" } */
export function pisahNama(nama: string): { firstName: string; lastName?: string } {
  const bagian = nama.trim().split(/\s+/);
  const firstName = bagian[0] ?? nama;
  const lastName = bagian.slice(1).join(" ");
  return lastName ? { firstName, lastName } : { firstName };
}

/** Terjemahkan error Clerk menjadi HttpError dengan pesan yang bisa dibaca Admin. */
export function galatClerk(err: unknown, fallback = "Gagal memproses akun di Clerk."): HttpError {
  if (isClerkAPIResponseError(err)) {
    const kode = kodeClerk(err);
    if (kode?.startsWith("form_identifier_exists")) {
      return new HttpError(409, pesanClerk(err, "akun"));
    }
    if (kode?.startsWith("form_password")) {
      return new HttpError(400, pesanClerk(err, "akun", "Kata sandi tidak memenuhi syarat."));
    }
    return new HttpError(err.status >= 400 && err.status < 500 ? err.status : 502, pesanClerk(err, "akun", fallback));
  }
  console.error("[arsiva:clerk]", err);
  return new HttpError(502, fallback);
}

/**
 * clerk_id yang akun Clerk-nya sudah tertaut ke Google (pernah masuk lewat Google).
 * Satu panggilan untuk semua id. Bila Clerk tidak terjangkau, kembalikan null agar
 * daftar pengguna tetap bisa tampil tanpa penanda ini.
 */
export async function idTertautGoogle(clerkIds: string[]): Promise<Set<string> | null> {
  if (clerkIds.length === 0) return new Set();
  try {
    const clerk = await clerkClient();
    const { data } = await clerk.users.getUserList({ userId: clerkIds, limit: Math.min(clerkIds.length, 500) });
    return new Set(
      data
        .filter((u) => u.externalAccounts.some((a) => a.provider.includes("google")))
        .map((u) => u.id),
    );
  } catch (err) {
    console.error("[arsiva:clerk] gagal membaca tautan Google:", err);
    return null;
  }
}

/** true bila error Clerk berarti sumber dayanya sudah tidak ada. */
export function tidakDitemukan(err: unknown): boolean {
  return isClerkAPIResponseError(err) && err.status === 404;
}

export async function buatAkun(input: { nama: string; email: string; password: string }): Promise<string> {
  const clerk = await clerkClient();
  try {
    const u = await clerk.users.createUser({
      emailAddress: [input.email],
      password: input.password,
      ...pisahNama(input.nama),
      // Kata sandi awal bersifat sementara dan dibagikan Admin; jangan ditolak
      // karena dianggap lemah/bocor.
      skipPasswordChecks: true,
    });
    return u.id;
  } catch (err) {
    throw galatClerk(err, "Gagal membuat akun di Clerk.");
  }
}

export async function ubahNama(clerkId: string, nama: string): Promise<void> {
  const clerk = await clerkClient();
  try {
    await clerk.users.updateUser(clerkId, pisahNama(nama));
  } catch (err) {
    throw galatClerk(err, "Gagal mengubah nama di Clerk.");
  }
}

/** Ganti email utama: tambah alamat baru (terverifikasi, utama), lalu hapus yang lama. */
export async function ubahEmail(clerkId: string, emailBaru: string): Promise<void> {
  const clerk = await clerkClient();
  try {
    const u = await clerk.users.getUser(clerkId);
    const lama = u.emailAddresses.filter((e) => e.emailAddress.toLowerCase() !== emailBaru);
    await clerk.emailAddresses.createEmailAddress({
      userId: clerkId,
      emailAddress: emailBaru,
      verified: true,
      primary: true,
    });
    for (const e of lama) await clerk.emailAddresses.deleteEmailAddress(e.id);
  } catch (err) {
    throw galatClerk(err, "Gagal mengubah email di Clerk.");
  }
}

/** Nonaktifkan = blokir (tidak bisa masuk); aktifkan = buka blokir. */
export async function setAktif(clerkId: string, aktif: boolean): Promise<void> {
  const clerk = await clerkClient();
  try {
    if (aktif) await clerk.users.unbanUser(clerkId);
    else await clerk.users.banUser(clerkId);
  } catch (err) {
    throw galatClerk(err, "Gagal mengubah status akun di Clerk.");
  }
}

export async function hapusAkun(clerkId: string): Promise<void> {
  const clerk = await clerkClient();
  try {
    await clerk.users.deleteUser(clerkId);
  } catch (err) {
    if (tidakDitemukan(err)) return;
    throw galatClerk(err, "Gagal menghapus akun di Clerk.");
  }
}
