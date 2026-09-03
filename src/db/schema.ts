// ARSIVA — Drizzle schema (Tahap 2).
//
// Mengikuti PRD §6 "Database Schema". Catatan pemetaan:
// - PRD `users.password_hash` tidak disimpan di tabel `user`, melainkan di
//   `account.password` — Better Auth yang mengelola hashing & verifikasinya.
// - PRD `users.nama` dipetakan ke kolom `name` milik Better Auth.
// - Tabel `notifications` adalah tambahan untuk notifikasi in-app (adapter email).

import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch())`;

/* ───────────────────────── Better Auth ───────────────────────── */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  // Kolom tambahan ARSIVA (PRD: peran, reminder_threshold_days)
  peran: text("peran", { enum: ["Admin", "Team Member", "Pembaca"] }).notNull().default("Team Member"),
  unit: text("unit").notNull().default("Divisi Legal"),
  aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  reminderThresholdDays: integer("reminder_threshold_days").notNull().default(60),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  // Wajib sejak better-auth 1.7 (penerbit kredensial/OAuth).
  issuer: text("issuer").notNull().default(""),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
});

/* ───────────────────────── Master data ───────────────────────── */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull().unique(),
  deskripsi: text("deskripsi").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const documentTypes = sqliteTable("document_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const purposes = sqliteTable("purposes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

/* ───────────────────────── Dokumen ───────────────────────── */

export const documents = sqliteTable(
  "documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => user.id),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    typeId: integer("type_id").references(() => documentTypes.id, { onDelete: "set null" }),
    purposeId: integer("purpose_id").references(() => purposes.id, { onDelete: "set null" }),
    namaDokumen: text("nama_dokumen").notNull(),
    keterangan: text("keterangan").notNull().default(""),
    // Berkas hasil scan (disimpan di storage, bukan di database)
    filePath: text("file_path"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    // Tanggal disimpan sebagai teks ISO "YYYY-MM-DD" agar mudah dibandingkan
    tanggalKadaluarsa: text("tanggal_kadaluarsa").notNull(),
    // "aktif" | "diproses" — status kadaluarsa/segera diturunkan dari tanggal
    status: text("status", { enum: ["aktif", "diproses"] }).notNull().default("aktif"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [
    index("documents_expiry_idx").on(t.tanggalKadaluarsa),
    index("documents_user_idx").on(t.userId),
  ],
);

export const documentReminders = sqliteTable("document_reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  notifiedAt: integer("notified_at", { mode: "timestamp" }),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

export const documentShares = sqliteTable(
  "document_shares",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    penerimaEmail: text("penerima_email").notNull(),
    penerimaTipe: text("penerima_tipe", { enum: ["Notaris", "Rekanan"] }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("shares_token_idx").on(t.token)],
);

/* ───────────────────────── Notaris ───────────────────────── */

export const notaris = sqliteTable("notaris", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  kantor: text("kantor").notNull().default(""),
  email: text("email").notNull().default(""),
  noTelepon: text("no_telepon").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  notarisId: integer("notaris_id").notNull().references(() => notaris.id, { onDelete: "cascade" }),
  agenda: text("agenda").notNull(),
  tanggal: text("tanggal").notNull(), // "YYYY-MM-DD"
  jam: text("jam").notNull().default("09:00"),
  status: text("status", { enum: ["Direncanakan", "Selesai", "Dibatalkan"] }).notNull().default("Direncanakan"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

/* ─────────────────── Notifikasi in-app (adapter email) ─────────────────── */

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    pesan: text("pesan").notNull(),
    tipe: text("tipe", { enum: ["kadaluarsa", "berbagi", "sistem"] }).notNull().default("sistem"),
    dibacaAt: integer("dibaca_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

/* ───────────────────────── Relations ───────────────────────── */

export const userRelations = relations(user, ({ many }) => ({
  documents: many(documents),
  notifications: many(notifications),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  pengunggah: one(user, { fields: [documents.userId], references: [user.id] }),
  kategori: one(categories, { fields: [documents.categoryId], references: [categories.id] }),
  jenis: one(documentTypes, { fields: [documents.typeId], references: [documentTypes.id] }),
  tujuan: one(purposes, { fields: [documents.purposeId], references: [purposes.id] }),
  reminders: many(documentReminders),
  shares: many(documentShares),
}));

export const documentSharesRelations = relations(documentShares, ({ one }) => ({
  dokumen: one(documents, { fields: [documentShares.documentId], references: [documents.id] }),
}));

export const documentRemindersRelations = relations(documentReminders, ({ one }) => ({
  dokumen: one(documents, { fields: [documentReminders.documentId], references: [documents.id] }),
}));

export const notarisRelations = relations(notaris, ({ many }) => ({
  jadwal: many(schedules),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  notaris: one(notaris, { fields: [schedules.notarisId], references: [notaris.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  penerima: one(user, { fields: [notifications.userId], references: [user.id] }),
}));
