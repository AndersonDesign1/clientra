# CLAUDE.md

Guidance for AI agents and new contributors working in this repo. For product
intent see `PRD.md`, for roadmap/status see `phases.md`, and for the latest
hardening audit see `docs/audits/production-readiness-audit.md`.

## What this is

Clientra — a deliberately lightweight client/project management app for
freelancers and small agencies. An **admin** (the operator) manages clients and
projects; external **clients** get a read-mostly portal.

**Non-goals (do not build these):** enterprise CRM workflows, marketing/sales
pipelines, complex automation, and billing/invoicing/payments. Keep changes
lightweight and in line with `PRD.md`.

## Stack

TanStack Start (React 19) · Drizzle ORM + Turso (libSQL/SQLite) · Better Auth ·
Zod · Bun · Vitest · Biome + Ultracite · Tailwind v4 + shadcn/ui.

## Commands

- `bun dev` — dev server (port 3000)
- `bun run test` — Vitest
- `bun run lint` — Biome (via Ultracite)
- `bun run typecheck` — `tsc --noEmit`
- `bun run build` — Vite build
- `bun run db:studio` — Drizzle Studio
- `bun run db:sync` — push schema + seed (local/dev)

Before opening a PR, all of `lint`, `typecheck`, `test`, and `build` must pass.

## Layout

- `src/routes/**` — pages; `src/routes/api/**` — server route handlers.
- `src/server/http/route-utils.ts` — request guards: `requireSessionRequest`,
  `requireMutationSessionRequest`, `requireAdminMutationRequest`,
  `requireSameOrigin`, plus JSON/error helpers. Use these; don't hand-roll auth.
- `src/db/records.ts` — the data-access layer (large; being split by domain).
- `src/db/schema.ts` — Drizzle schema; migrations live in `drizzle/` and are
  generated with `drizzle-kit generate`.
- `src/auth/**` — Better Auth config (`better-auth.ts`), roles (`roles.ts`),
  session helpers (`session.server.ts`).
- `src/lib/api.ts` — client-side fetch + React Query hooks (large; being split).
- `src/__tests__/**` — tests. DB-backed tests apply `drizzle/*.sql` to a temp
  `file:` libSQL database — see `records-collaboration.test.ts` for the pattern.

## Conventions

- **Auth on every mutating route**: same-origin + session (+ role/ownership)
  checks via the guards in `route-utils.ts`. Client-reachable routes that touch a
  project/file/note must call `canAccessProject` (in `records.ts`).
- **Validate input with Zod** via `parseJsonBody(request, schema)` before use.
- **Roles**: `ROLES.ADMIN` / `ROLES.CLIENT` from `src/auth/roles.ts` — never
  hardcode the strings. The `role` field is server-controlled (not settable at
  signup).
- **Error handling**: return the typed helpers from `route-utils.ts`
  (`unauthorizedError`, `forbiddenError`, `notFoundError`, …), not ad-hoc responses.
- Match the surrounding file's style; run `bun run fix` (Ultracite) to auto-format.

## Known debt / gotchas

- `src/db/records.ts` and `src/lib/api.ts` are oversized and being split by domain
  (see `plans/`). Prefer adding to the right domain seam over growing them.
- `src/components/evilcharts/**` is vendored chart code and is excluded from
  linting — don't hand-fix lint there.
- Seeding (`seedIfEmpty`) is for local/dev only — enforced by a non-local DB
  guard; it must not run from request handlers or against production Turso.
- Multi-tenancy (Better Auth `organization` plugin + `organizationId` columns) is
  partially wired — confirm scoping before relying on it.

## Where to look first

- A bug in data access → `src/db/records.ts` + the matching `src/__tests__/` file.
- An auth/access question → `src/auth/` + `src/server/http/route-utils.ts`.
- A page/data-flow question → the route in `src/routes/` + `src/lib/api.ts`.