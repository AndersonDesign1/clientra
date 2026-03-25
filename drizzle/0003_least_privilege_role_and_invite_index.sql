CREATE UNIQUE INDEX IF NOT EXISTS `invites_token_unique` ON `invites` (`token`);--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "role" TO "role" text NOT NULL DEFAULT 'client';
