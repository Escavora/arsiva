// Penyimpanan berkas hasil scan di Cloudflare R2.
//
// Bucket diakses lewat binding Worker `FILES` (lihat wrangler.jsonc), jadi
// tidak ada kredensial di kode maupun .env. Bucket bersifat PRIVATE: browser
// tidak pernah menerima URL R2 — berkas selalu disalurkan lewat endpoint kita
// sendiri (/api/documents/[id]/file atau /s/[token]/file) yang memverifikasi
// sesi/token lebih dulu.
//
// Di lokal (`next dev` / `npm run preview`) Wrangler menyimulasikan bucket di
// .wrangler/state, jadi tidak perlu akun Cloudflare untuk pengembangan.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type StoredFile = {
  /** Kunci objek di R2; disimpan di kolom documents.file_path */
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
};

export type FileObject = {
  /** Isi berkas sebagai stream, langsung bisa dipakai sebagai body Response. */
  body: ReadableStream;
  size: number;
  mimeType: string;
  fileName: string;
};

export interface StorageDriver {
  nama: string;
  put(file: File): Promise<StoredFile>;
  get(key: string): Promise<FileObject | null>;
  delete(key: string): Promise<void>;
}

/**
 * Bagian API binding R2 yang dipakai di sini. Sengaja didefinisikan sendiri:
 * tipe runtime Workers lengkap (`wrangler types`) menimpa tipe DOM proyek ini
 * dan membuat `Request.json()` bertipe `unknown` di seluruh route.
 */
type R2Object = {
  body: ReadableStream;
  size: number;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};
type FilesBucket = {
  put(
    key: string,
    value: Blob,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> },
  ): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
};

declare global {
  interface CloudflareEnv {
    FILES: FilesBucket;
  }
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

/** Ekstensi berkas (mis. ".pdf"), atau ".bin" bila tidak ada. */
function ekstensi(nama: string): string {
  return /\.[A-Za-z0-9]{1,10}$/.exec(nama)?.[0].toLowerCase() ?? ".bin";
}

function bucket(): FilesBucket {
  const files = getCloudflareContext().env.FILES;
  if (!files) {
    throw new Error("Binding R2 \"FILES\" tidak ditemukan. Periksa r2_buckets di wrangler.jsonc.");
  }
  return files;
}

const r2Driver: StorageDriver = {
  nama: "r2",

  async put(file) {
    assertUploadable(file);
    const key = `${namaFolderBulan()}/${crypto.randomUUID()}${ekstensi(file.name)}`;
    await bucket().put(key, file, {
      httpMetadata: { contentType: file.type },
      // Metadata R2 hanya menerima string; nama di-encode agar aman untuk
      // karakter non-ASCII.
      customMetadata: { fileName: encodeURIComponent(file.name) },
    });
    return { key, fileName: file.name, size: file.size, mimeType: file.type };
  },

  async get(key) {
    const obj = await bucket().get(key);
    if (!obj) return null;
    const encoded = obj.customMetadata?.fileName;
    return {
      body: obj.body,
      size: obj.size,
      mimeType: obj.httpMetadata?.contentType || "application/octet-stream",
      fileName: encoded ? decodeURIComponent(encoded) : key.split("/").pop() || "berkas",
    };
  },

  async delete(key) {
    try {
      // R2 tidak melempar error untuk kunci yang tidak ada.
      await bucket().delete(key);
    } catch (err) {
      // Gagal menghapus berkas jangan memblokir penghapusan dokumen.
      console.error(`[arsiva:storage] gagal menghapus ${key}:`, err);
    }
  },
};

export function getStorage(): StorageDriver {
  return r2Driver;
}
