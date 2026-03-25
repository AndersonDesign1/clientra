ALTER TABLE `files` ADD `storage_key` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `files` ADD `file_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `files` ADD `file_size` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `files` ADD `mime_type` text NOT NULL DEFAULT '';--> statement-breakpoint
CREATE UNIQUE INDEX `files_storage_key_unique` ON `files` (`storage_key`);
