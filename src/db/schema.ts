// ARSIVA — Drizzle schema.
//
// Mengikuti PRD §6 "Database Schema". Catatan pemetaan:
// - Identitas & kata sandi dikelola Clerk. Tabel `user` hanya profil lokal
//   ARSIVA: `clerk_id` menautkannya ke akun Clerk, sedangkan primary key lokal
//   tetap supaya foreign key dokumen/notifikasi/tautan berbagi tidak terikat ke
//   penyedia login. PRD `users.password_hash` tidak ada di sini.
// - PRD `users.nama` dipetakan ke kolom `name`.
// - Peran, unit, dan status aktif disimpan di sini (sumber kebenaran), bukan
//   di Clerk.
// - Tabel `notifications` adalah tambahan untuk notifikasi in-app (adapter email).

import { relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, date, index } from "drizzle-orm/pg-core";

/** Timestamp dengan zona waktu; Workers selalu berjalan di UTC. */
const ts = (name: string) => timestamp(name, { withTimezone: true });

/* ───────────────────────── Pengguna ───────────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // ID pengguna di Clerk (user_xxx). Null = belum ditautkan ke akun Clerk.
  clerkId: text("clerk_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // Kolom tambahan ARSIVA (PRD: peran, reminder_threshold_days)
  peran: text("peran", { enum: ["Admin", "Team Member", "Pembaca"] }).notNull().default("Team Member"),
  unit: text("unit").notNull().default("Divisi Legal"),
  aktif: boolean("aktif").notNull().default(true),
  reminderThresholdDays: integer("reminder_threshold_days").notNull().default(60),
  // Batas sesi 30 menit tanpa aktivitas (PRD) — Clerk gratis tidak punya
  // inactivity timeout, jadi ditegakkan sendiri di src/lib/guard.ts.
  lastActiveAt: ts("last_active_at"),
  lastSessionId: text("last_session_id"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/* ───────────────────────── Master data ───────────────────────── */

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull().unique(),
  deskripsi: text("deskripsi").notNull().default(""),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const documentTypes = pgTable("document_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const purposes = pgTable("purposes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

/* ───────────────────────── Dokumen ───────────────────────── */

export const documents = pgTable(
  "documents",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
    // Tipe date; mode "string" menjaga nilainya tetap "YYYY-MM-DD" di kode.
    tanggalKadaluarsa: date("tanggal_kadaluarsa", { mode: "string" }).notNull(),
    // "aktif" | "diproses" — status kadaluarsa/segera diturunkan dari tanggal
    status: text("status", { enum: ["aktif", "diproses"] }).notNull().default("aktif"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("documents_expiry_idx").on(t.tanggalKadaluarsa),
    index("documents_user_idx").on(t.userId),
  ],
);

export const documentReminders = pgTable("document_reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  notifiedAt: ts("notified_at"),
  processedAt: ts("processed_at"),
});

export const documentShares = pgTable(
  "document_shares",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    penerimaEmail: text("penerima_email").notNull(),
    penerimaTipe: text("penerima_tipe", { enum: ["Notaris", "Rekanan"] }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("shares_token_idx").on(t.token)],
);

/* ───────────────────────── Notaris ───────────────────────── */

export const notaris = pgTable("notaris", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull(),
  kantor: text("kantor").notNull().default(""),
  email: text("email").notNull().default(""),
  noTelepon: text("no_telepon").notNull().default(""),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  notarisId: integer("notaris_id").notNull().references(() => notaris.id, { onDelete: "cascade" }),
  agenda: text("agenda").notNull(),
  tanggal: date("tanggal", { mode: "string" }).notNull(), // "YYYY-MM-DD"
  jam: text("jam").notNull().default("09:00"),
  status: text("status", { enum: ["Direncanakan", "Selesai", "Dibatalkan"] }).notNull().default("Direncanakan"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

/* ─────────────────── Notifikasi in-app (adapter email) ─────────────────── */

export const notifications = pgTable(
  "notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
    judul: text("judul").notNull(),
    pesan: text("pesan").notNull(),
    tipe: text("tipe", { enum: ["kadaluarsa", "berbagi", "sistem"] }).notNull().default("sistem"),
    dibacaAt: ts("dibaca_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
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
