ALTER TABLE `projects` ADD `slug` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `projects`
SET `slug` = `id`;--> statement-breakpoint
WITH RECURSIVE
  `project_input`(`id`, `title`) AS (
    SELECT `id`, lower(`title`)
    FROM `projects`
  ),
  `slug_chars`(`id`, `position`, `raw_slug`) AS (
    SELECT `id`, 1, ''
    FROM `project_input`
    UNION ALL
    SELECT
      `slug_chars`.`id`,
      `position` + 1,
      `raw_slug` ||
        CASE
          WHEN substr(`title`, `position`, 1) BETWEEN 'a' AND 'z'
            OR substr(`title`, `position`, 1) BETWEEN '0' AND '9'
          THEN substr(`title`, `position`, 1)
          ELSE '-'
        END
    FROM `slug_chars`
    INNER JOIN `project_input` ON `project_input`.`id` = `slug_chars`.`id`
    WHERE `position` <= length(`title`)
  ),
  `raw_slugs`(`id`, `slug`) AS (
    SELECT `id`, trim(`raw_slug`, '-')
    FROM `slug_chars`
    WHERE `position` = (
      SELECT length(`title`) + 1
      FROM `project_input`
      WHERE `project_input`.`id` = `slug_chars`.`id`
    )
  ),
  `collapsed_slugs`(`id`, `slug`) AS (
    SELECT `id`, `slug`
    FROM `raw_slugs`
    UNION ALL
    SELECT `id`, replace(`slug`, '--', '-')
    FROM `collapsed_slugs`
    WHERE instr(`slug`, '--') > 0
  ),
  `base_slugs`(`id`, `slug`) AS (
    SELECT `id`, CASE WHEN `slug` = '' THEN `id` ELSE `slug` END
    FROM `collapsed_slugs`
    WHERE instr(`slug`, '--') = 0
  )
UPDATE `projects`
SET `slug` = (
  SELECT `slug`
  FROM `base_slugs`
  WHERE `base_slugs`.`id` = `projects`.`id`
);--> statement-breakpoint
WITH `ranked_slugs` AS (
  SELECT
    `project`.`id`,
    `project`.`slug`,
    (
      SELECT count(*)
      FROM `projects` AS `prior_project`
      WHERE `prior_project`.`client_id` = `project`.`client_id`
        AND `prior_project`.`slug` = `project`.`slug`
        AND (
          `prior_project`.`created_at` < `project`.`created_at`
          OR (
            `prior_project`.`created_at` = `project`.`created_at`
            AND `prior_project`.`id` < `project`.`id`
          )
        )
    ) + 1 AS `slug_rank`
  FROM `projects` AS `project`
)
UPDATE `projects`
SET `slug` = (
  SELECT
    CASE
      WHEN `slug_rank` = 1 THEN `slug`
      ELSE `slug` || '-' || `slug_rank`
    END
  FROM `ranked_slugs`
  WHERE `ranked_slugs`.`id` = `projects`.`id`
);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_client_id_slug_unique` ON `projects` (`client_id`,`slug`);
