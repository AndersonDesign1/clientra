CREATE TABLE `status_change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`requested_status` text NOT NULL,
	`reason` text NOT NULL,
	`approval_state` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `status_change_requests_project_id_idx` ON `status_change_requests` (`project_id`);--> statement-breakpoint
ALTER TABLE `invites` ADD `initiated_by_client_id` text REFERENCES clients(id);--> statement-breakpoint
ALTER TABLE `invites` ADD `admin_approved_at` integer;--> statement-breakpoint
CREATE INDEX `invites_client_id_idx` ON `invites` (`client_id`);--> statement-breakpoint
CREATE INDEX `client_users_user_id_idx` ON `client_users` (`user_id`);--> statement-breakpoint
ALTER TABLE `client_users` ALTER COLUMN "organization_id" TO "organization_id" text REFERENCES organization(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `clients_organization_id_idx` ON `clients` (`organization_id`);--> statement-breakpoint
ALTER TABLE `clients` ALTER COLUMN "organization_id" TO "organization_id" text REFERENCES organization(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `files_project_id_idx` ON `files` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_milestones_project_id_idx` ON `project_milestones` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_notes_project_id_idx` ON `project_notes` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_updates_project_id_idx` ON `project_updates` (`project_id`);