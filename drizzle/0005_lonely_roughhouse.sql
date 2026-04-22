ALTER TABLE `projects` ADD `slug` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `projects`
SET `slug` = `id`;--> statement-breakpoint
UPDATE `projects`
SET `slug` = `base_slug`
FROM (
  SELECT
    `id`,
    CASE
      WHEN `raw_slug` = '' THEN `id`
      ELSE `raw_slug`
    END AS `base_slug`
  FROM (
    SELECT
      `id`,
      lower(
        trim(
          replace(
            replace(
              replace(
                replace(`title`, ' ', '-'),
                '_',
                '-'
              ),
              '.',
              ''
            ),
            '/',
            '-'
          ),
          '-'
        )
      ) AS `raw_slug`
    FROM `projects`
  )
) AS `backfill`
WHERE `projects`.`id` = `backfill`.`id`;--> statement-breakpoint
UPDATE `projects`
SET `slug` = `deduped_slug`
FROM (
  SELECT
    `id`,
    CASE
      WHEN `slug_rank` = 1 THEN `slug`
      ELSE `slug` || '-' || `slug_rank`
    END AS `deduped_slug`
  FROM (
    SELECT
      `id`,
      `slug`,
      row_number() OVER (
        PARTITION BY `client_id`, `slug`
        ORDER BY `created_at`, `id`
      ) AS `slug_rank`
    FROM `projects`
  )
) AS `deduped`
WHERE `projects`.`id` = `deduped`.`id`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_client_id_slug_unique` ON `projects` (`client_id`,`slug`);
