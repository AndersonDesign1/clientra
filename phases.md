# Clientra Implementation Roadmap

## How to use this tracker
`phases.md` is the single source of truth for product progress and next actions. Keep updates feature-level, use the status labels `Done`, `Current`, `Next`, `Not started`, and `Blocked`, and move the `Current` marker to the next shippable slice as work progresses.

## Current Focus
Phase 6 is current. The next shippable slice is production-readiness hardening across security, performance, folder structure, shadcn UI consistency, Vercel runtime configuration, and browser QA before Phase 5 expands invites and notifications.

## Phase 1 - Frontend Foundation
Status: Done

- Done: Initialize project with TanStack Start and shared UI primitives.
- Done: Set up reusable admin shell, portal shell, and common state components.
- Done: Build public auth pages (`/login`, `/signup`, invite accept flow).
- Done: Build admin pages (`/dashboard`, `/clients`, `/clients/:id`, `/projects`, `/settings`).
- Done: Build client portal pages (`/portal`, `/portal/projects`, `/portal/projects/:id`).

## Phase 2 - Backend, DB, and Auth Foundation
Status: Done

- Done: Expose modular API routes through TanStack Start server handlers.
- Done: Add shared Zod validation for core payloads.
- Done: Define and migrate the Drizzle schema.
- Done: Wire Turso-backed Drizzle client and runtime env loading.
- Done: Mount Better Auth and enable session-backed route protection.

## Phase 3 - Core Admin Operations
Status: Done

- Done: Connect dashboard, clients, projects, and portal views to real API data.
- Done: Add invite generation and invite redemption flows.
- Done: Add email/password plus Google and GitHub sign-in paths.
- Done: Add global search over clients and projects with DB-backed filtering.
- Done: Add role guards, redirects, and auth-backed ownership for user-generated notes.
- Done: Add in-app admin user management for listing users, changing roles, and deleting non-self accounts.
- Done: Complete clients create, edit, archive, and delete flows from the admin UI.
- Done: Complete projects create, edit, delete, and status update flows from the admin UI.
- Done: Add readable client and project URLs, including client-scoped project slugs.
- Done: Enforce unique project slugs per client at the database level.
- Done: Improve client detail with linked projects and primary admin actions.
- Done: Add focused API coverage for admin client and project update/delete flows.
- Done: Add pending invite visibility on client detail pages.
- Done: Add focused UI coverage for admin client and project management flows.

## Phase 4 - Client Delivery Experience
Status: Current

- Done: Add real file uploads, downloads, and admin delete flows for project files across admin and portal project views.
- Done: Add comments/discussion flows for client collaboration.
- Done: Replace dashboard recent activity and project timeline sections with DB-backed collaboration history.
- Done: Add non-blocking route loading with shared pending skeletons for authenticated data routes.
- Done: Add project updates or status reports as a first-class progress surface.
- Done: Add lightweight milestones or deliverables for project planning and client visibility.
- Done: Improve the portal dashboard and project detail pages so clients can quickly see active work, latest updates, key dates, files, and discussion.
- Done: Keep comments and files as collaboration support, not the only way to communicate project progress.
- Next: Run browser QA across admin and portal delivery workflows before launch.

## Phase 5 - Access, Invites, and Notifications
Status: Not started

- Done: Show pending invites on relevant admin client views.
- Not started: Add resend and revoke actions for pending invites.
- Not started: Add lightweight email notifications for client invites, new project updates, new files, and new comments.
- Not started: Add notification safeguards so Clientra stays lightweight and avoids complex automation workflows.

## Phase 6 - QA, Production Readiness, and Launch
Status: Current

- Done: Write PRD (`PRD.md`).
- Done: Update README with setup and stack notes.
- Done: Establish repeatable verification with `lint`, `typecheck`, `check`, and `build`.
- Done: Add automated tests for protected-route pending-state navigation.
- Done: Start tracked production-readiness audit (`docs/audits/production-readiness-audit.md`).
- Done: Centralize server request guards and add same-origin regression coverage.
- Done: Adopt shadcn-style admin and portal sidebar shells plus shared shadcn feedback states.
- Current: Complete production verification, Vercel readiness checks, and browser QA before Phase 5.
- Not started: Add automated tests for auth and invite flows.
- Not started: Add end-to-end coverage for core admin and client portal flows.
- Not started: Add deployment/runtime validation for production auth callbacks, cookies, Turso, UploadThing, and OAuth configuration.
- Not started: Review demo/seed data behavior before launch.
