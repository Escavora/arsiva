// Pemetaan baris database → bentuk yang dipakai UI.
//
// Sengaja mempertahankan nama pendek (n, k, j, t, e, u, o, s, p) yang sudah
// dipakai helper frontend (viewDoc/analytics) sejak Tahap 1, supaya perpindahan
// dari data contoh ke database tidak mengubah logika tampilan.

export type ApiDoc = {
  id: number;
  n: string; // nama dokumen
  k: string; // kategori
  j: string; // jenis
  t: string; // tujuan
  e: string; // tanggal kadaluarsa (YYYY-MM-DD)
  u: string; // tanggal unggah (YYYY-MM-DD)
  o: string; // pemilik/pengunggah
  s: string; // ukuran berkas, mis. "3,2 MB"
  p: boolean; // sudah diproses
  ket: string;
  hasFile: boolean;
  fileName: string | null;
  categoryId: number | null;
  typeId: number | null;
  purposeId: number | null;
};

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export function toDateOnly(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  // Pakai komponen lokal agar tanggal tidak bergeser sehari karena zona waktu.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DocRow = {
  id: number;
  namaDokumen: string;
  keterangan: string;
  tanggalKadaluarsa: string;
  status: string;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
  categoryId: number | null;
  typeId: number | null;
  purposeId: number | null;
  kategori?: { nama: string } | null;
  jenis?: { nama: string } | null;
  tujuan?: { nama: string } | null;
  pengunggah?: { name: string } | null;
};

export function mapDoc(d: DocRow): ApiDoc {
  return {
    id: d.id,
    n: d.namaDokumen,
    k: d.kategori?.nama ?? "—",
    j: d.jenis?.nama ?? "—",
    t: d.tujuan?.nama ?? "—",
    e: d.tanggalKadaluarsa,
    u: toDateOnly(d.createdAt),
    o: d.pengunggah?.name ?? "—",
    s: formatBytes(d.fileSize),
    p: d.status === "diproses",
    ket: d.keterangan ?? "",
    hasFile: !!d.filePath,
    fileName: d.fileName,
    categoryId: d.categoryId,
    typeId: d.typeId,
    purposeId: d.purposeId,
  };
}

export const docWith = {
  kategori: { columns: { nama: true } },
  jenis: { columns: { nama: true } },
  tujuan: { columns: { nama: true } },
  pengunggah: { columns: { name: true } },
} as const;
