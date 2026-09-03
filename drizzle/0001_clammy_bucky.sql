DROP INDEX "categories_nama_unique";--> statement-breakpoint
DROP INDEX "document_shares_token_unique";--> statement-breakpoint
DROP INDEX "shares_token_idx";--> statement-breakpoint
DROP INDEX "document_types_nama_unique";--> statement-breakpoint
DROP INDEX "documents_expiry_idx";--> statement-breakpoint
DROP INDEX "documents_user_idx";--> statement-breakpoint
DROP INDEX "notifications_user_idx";--> statement-breakpoint
DROP INDEX "purposes_nama_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "peran" TO "peran" text NOT NULL DEFAULT 'Team Member';--> statement-breakpoint
CREATE UNIQUE INDEX `categories_nama_unique` ON `categories` (`nama`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_shares_token_unique` ON `document_shares` (`token`);--> statement-breakpoint
CREATE INDEX `shares_token_idx` ON `document_shares` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_types_nama_unique` ON `document_types` (`nama`);--> statement-breakpoint
CREATE INDEX `documents_expiry_idx` ON `documents` (`tanggal_kadaluarsa`);--> statement-breakpoint
CREATE INDEX `documents_user_idx` ON `documents` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `purposes_nama_unique` ON `purposes` (`nama`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);