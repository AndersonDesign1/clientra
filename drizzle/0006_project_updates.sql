CREATE TABLE `project_updates` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `author_id` text NOT NULL,
  `title` text NOT NULL,
  `body` text NOT NULL,
  `status` text DEFAULT 'on_track' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
