CREATE TABLE `workspace_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`workspace_name` text DEFAULT 'Clientra' NOT NULL,
	`support_email` text DEFAULT 'support@clientra.com' NOT NULL,
	`allow_signups` integer DEFAULT false NOT NULL,
	`enable_notifications` integer DEFAULT true NOT NULL,
	`auto_archive` integer DEFAULT true NOT NULL,
	`portal_url` text,
	`logo_url` text,
	`updated_at` integer NOT NULL
);
