CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `client_users_client_id_user_id_unique` ON `client_users` (`client_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `client_users` ALTER COLUMN "client_id" TO "client_id" text NOT NULL REFERENCES clients(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `client_users` ALTER COLUMN "user_id" TO "user_id" text NOT NULL REFERENCES users(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ALTER COLUMN "project_id" TO "project_id" text NOT NULL REFERENCES projects(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ALTER COLUMN "uploaded_by" TO "uploaded_by" text NOT NULL REFERENCES users(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_notes` ALTER COLUMN "project_id" TO "project_id" text NOT NULL REFERENCES projects(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_notes` ALTER COLUMN "user_id" TO "user_id" text NOT NULL REFERENCES users(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ALTER COLUMN "client_id" TO "client_id" text NOT NULL REFERENCES clients(id) ON DELETE cascade ON UPDATE no action;