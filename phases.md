# Clientra Implementation Phases

## Phase 1 — Frontend Foundation
Status: Done

- Done: Initialize project with TanStack Start and shared UI primitives
- Done: Set up reusable admin shell, portal shell, and common state components
- Done: Build public auth pages (`/login`, `/signup`, invite accept flow)
- Done: Build admin pages (`/dashboard`, `/clients`, `/clients/:id`, `/projects`, `/settings`)
- Done: Build client portal pages (`/portal`, `/portal/projects`, `/portal/projects/:id`)

## Phase 2 — Backend, DB, and Auth Foundation
Status: Done

- Done: Expose modular API routes through TanStack Start server handlers
- Done: Add shared Zod validation for core payloads
- Done: Define and migrate the Drizzle schema
- Done: Wire Turso-backed Drizzle client and runtime env loading
- Done: Mount Better Auth and enable session-backed route protection

## Phase 3 — Feature Wiring and Domain Flows
Status: Ongoing

- Done: Connect dashboard, clients, projects, and portal views to real API data
- Done: Add invite generation and invite redemption flows
- Done: Add email/password plus Google and GitHub sign-in paths
- Done: Add global search over clients and projects with DB-backed filtering
- Done: Add role guards, redirects, and auth-backed ownership for user-generated notes
- Done: Add in-app admin user management for listing users, changing roles, and deleting non-self accounts
- Done: Add real file uploads, downloads, and admin delete flows for project files across admin and portal project views
- Done: Add non-blocking route loading with shared pending skeletons for authenticated data routes
- Done: Add comments/discussion flows for client collaboration
- Done: Replace dashboard recent activity and project timeline sections with DB-backed collaboration history

## Phase 4 — Documentation, QA, and Readiness
Status: Ongoing

- Done: Write PRD (`PRD.md`)
- Done: Update README with setup and stack notes
- Done: Keep this phase tracker aligned with implementation progress
- Done: Establish repeatable verification with `lint`, `typecheck`, `check`, and `build`
- Done: Add automated tests for protected-route pending-state navigation
- Not started: Add automated tests for auth and invite flows
- Not started: Add deployment/runtime validation for production auth callbacks and cookies
