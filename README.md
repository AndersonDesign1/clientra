# Clientra

A lightweight client management system for freelancers and small agencies.

## Stack
- TanStack Start + React + Tailwind + shadcn/ui
- TanStack Start server routes
- Turso SQLite + Drizzle ORM
- Better Auth
- Loop email notifications
- Zod
- Bun

## Getting Started
Copy `.env.example` to `.env.local` and fill in the values needed for your environment.
For Loop notifications, create transactional templates for invite, project update, file upload, and comment events, then set the matching `LOOP_*_TEMPLATE_ID` values. Keep `LOOP_ENABLED=false` locally when you want invite flows to skip email delivery.

```bash
bun install
bun dev
```

## Quality Checks
```bash
bun run test
bun run lint
bun run typecheck
bun run build
```

## Project Structure
- `src/routes` — public, admin, and client portal pages
- `src/components` — reusable UI/layout components
- `src/features` — feature-level mock data and domain modules
- `src/api` — shared request helpers and Zod validation
- `src/db` — Drizzle schema and Turso client
- `src/auth` — roles, guards, and Better Auth setup

## Planning Docs
- `PRD.md`
- `phases.md`
- `docs/audits/production-readiness-audit.md`
