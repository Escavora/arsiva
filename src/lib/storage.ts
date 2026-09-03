// Adapter penyimpanan berkas hasil scan.
//
// Driver aktif ditentukan oleh STORAGE_DRIVER di .env: "local" (disk, untuk
// pengembangan) atau "blob" (Vercel Blob, untuk produksi/deploy — filesystem
// Vercel bersifat sementara sehingga driver "local" TIDAK bisa dipakai di sana).
// Antarmuka sengaja kecil (put/get/delete) agar driver baru (S3, dsb.) bisa
// ditambahkan tanpa mengubah kode fitur.

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredFile = {
  /** Kunci logis berkas; disimpan di kolom documents.file_path */
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
};

export interface StorageDriver {
  nama: string;
  put(file: File): Promise<StoredFile>;
  get(key: string): Promise<{ body: Buffer; mimeType: string; fileName: string } | null>;
  delete(key: string): Promise<void>;
}

const MAX_BYTES = 20 * 1024 * 1024; // PRD: maksimal 20 MB per berkas
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function assertUploadable(file: File) {
  if (file.size <= 0) throw new Error("Berkas kosong.");
  if (file.size > MAX_BYTES) throw new Error("Ukuran berkas melebihi 20 MB.");
  if (!ALLOWED.has(file.type)) {
    throw new Error("Format berkas harus PDF, JPG, PNG, atau WebP.");
  }
}

function namaFolderBulan(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* ───────────────────────── Driver: local disk ───────────────────────── */
// Hanya untuk pengembangan lokal. Filesystem Vercel bersifat sementara —
// berkas yang ditulis driver ini TIDAK bertahan antar-deployment/request di
// sana, jadi wajib diganti ke driver "blob" sebelum deploy.

// Pakai `|| default` (bukan `??`) agar string kosong "" — yang bisa muncul bila
// variabel di-set kosong di platform deploy — diperlakukan seperti tidak diisi.
const ROOT = path.resolve(process.env.STORAGE_LOCAL_DIR?.trim() || "./storage/uploads");

/** Cegah path traversal: kunci hasil resolveKey wajib tetap di dalam ROOT. */
function resolveKey(key: string): string {
  const full = path.resolve(ROOT, key);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    throw new Error("Kunci berkas tidak valid.");
  }
  return full;
}

const localDriver: StorageDriver = {
  nama: "local",
  async put(file) {
    assertUploadable(file);
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).slice(0, 10) || ".bin";
    const key = `${namaFolderBulan()}/${randomUUID()}${ext}`;
    const full = resolveKey(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buf);
    // Sidecar metadata agar nama & tipe asli tidak hilang.
    await writeFile(`${full}.meta.json`, JSON.stringify({ fileName: file.name, mimeType: file.type }));
    return { key, fileName: file.name, size: buf.byteLength, mimeType: file.type };
  },

  async get(key) {
    try {
      const full = resolveKey(key);
      const body = await readFile(full);
      let fileName = path.basename(key);
      let mimeType = "application/octet-stream";
      try {
        const meta = JSON.parse(await readFile(`${full}.meta.json`, "utf8"));
        fileName = meta.fileName ?? fileName;
        mimeType = meta.mimeType ?? mimeType;
      } catch {
        // metadata opsional
      }
      return { body, mimeType, fileName };
    } catch {
      return null;
    }
  },

  async delete(key) {
    try {
      const full = resolveKey(key);
      await unlink(full);
      await unlink(`${full}.meta.json`).catch(() => {});
    } catch {
      // sudah tidak ada — abaikan
    }
  },
};

/* ───────────────────────── Driver: Vercel Blob ───────────────────────── */
//
// Store Blob di sini dikonfigurasi PRIVATE — bukan public. Ini justru pilihan
// yang tepat untuk arsip dokumen legal: URL blob tidak bisa diakses siapa pun
// tanpa BLOB_READ_WRITE_TOKEN, sama seperti driver "local". Kunci yang
// disimpan di documents.file_path adalah *pathname* blob (bukan URL), dan
// setiap baca/hapus memakai token lewat SDK @vercel/blob. Sama seperti driver
// lain, aplikasi tetap menyalurkan berkas lewat endpoint kita sendiri
// (/api/documents/[id]/file atau /s/[token]/file) yang memverifikasi
// sesi/token lebih dulu — bukan mengekspos blob secara langsung ke browser.

const blobDriver: StorageDriver = {
  nama: "blob",
  async put(file) {
    assertUploadable(file);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN belum diisi di .env.");

    const { put } = await import("@vercel/blob");
    const ext = path.extname(file.name).slice(0, 10) || ".bin";
    const pathname = `${namaFolderBulan()}/${randomUUID()}${ext}`;

    const blob = await put(pathname, file, {
      access: "private",
      token,
      contentType: file.type,
      addRandomSuffix: false,
    });

    return { key: blob.pathname, fileName: file.name, size: file.size, mimeType: file.type };
  },

  async get(key) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;
    try {
      const { get } = await import("@vercel/blob");
      const hasil = await get(key, { access: "private", token });
      if (!hasil || !hasil.stream) return null;
      const body = Buffer.from(await new Response(hasil.stream).arrayBuffer());
      const mimeType = hasil.blob.contentType || "application/octet-stream";
      const fileName = decodeURIComponent(path.basename(key)) || "berkas";
      return { body, mimeType, fileName };
    } catch {
      return null;
    }
  },

  async delete(key) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return; // tidak ada kredensial — tidak ada yang bisa dihapus
    try {
      const { del } = await import("@vercel/blob");
      await del(key, { token });
    } catch {
      // berkas sudah tidak ada / gagal dihapus — jangan blokir penghapusan dokumen
    }
  },
};

/* ───────────────────────── Pemilihan driver ───────────────────────── */

/**
 * Driver dipilih SETIAP KALI dipakai (bukan sekali saat modul dimuat), sesuai
 * pola yang sama dengan getMailer() di src/lib/notify.ts — supaya nilai
 * STORAGE_DRIVER dari .env selalu terbaca terkini, termasuk oleh skrip
 * standalone yang memuat .env belakangan.
 *
 * Ketahanan tambahan (dipetik dari bug produksi 03/09/2026):
 *  - Bila STORAGE_DRIVER tidak diisi TAPI ada BLOB_READ_WRITE_TOKEN, otomatis
 *    pakai "blob". Token blob = niat jelas memakai penyimpanan cloud.
 *  - Bila resolusi jatuh ke "local" padahal sedang berjalan di Vercel
 *    (filesystem read-only), gagalkan dengan pesan jelas — bukan ENOENT yang
 *    membingungkan saat mkdir di /var/task.
 */
export function getStorage(): StorageDriver {
  const explicit = process.env.STORAGE_DRIVER?.trim();
  const driver = explicit || (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");

  switch (driver) {
    case "blob":
      return blobDriver;
    case "local":
      if (process.env.VERCEL) {
        throw new Error(
          "Penyimpanan berkas belum dikonfigurasi untuk produksi. Set STORAGE_DRIVER=blob " +
            "dan BLOB_READ_WRITE_TOKEN di Environment Variables Vercel, lalu redeploy.",
        );
      }
      return localDriver;
    // TODO: tambahkan driver "s3" di sini bila diperlukan.
    default:
      console.warn(`[arsiva:storage] driver "${driver}" tidak dikenal, memakai "local".`);
      return localDriver;
  }
}

/** Checksum sederhana untuk keperluan audit/log. */
export function checksum(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}
