# Clientra

A lightweight client management system for freelancers and small agencies.

## Stack
- TanStack Start + React + Tailwind + shadcn/ui
- TanStack Start server routes
- Turso SQLite + Drizzle ORM
- Better Auth
- Zod
- Bun

## Getting Started
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
