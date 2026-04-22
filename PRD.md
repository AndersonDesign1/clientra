# Clientra Product Requirements Document

## Product Summary
Clientra is a lightweight client and project management system for freelancers, developers, and small agencies. It is intentionally not a full CRM and focuses on speed, clarity, and minimal workflows. The current product is partially implemented and still needs core admin operations, client delivery structure, invite management, notifications, and production QA before it should be considered complete.

## Personas
- **Admin**: Freelancer/agency operator managing client delivery.
- **Client**: External stakeholder viewing project updates and files.

## Goals
- Fast setup and daily usability.
- Clean dashboard with essential delivery metrics.
- Simple client portal for transparency.

## Non-goals
- Enterprise CRM workflows.
- Deep marketing/sales pipeline management.
- Complex automation tooling.
- Billing, invoicing, and payment processing.

## Core Features
1. Authentication (email/password) with role-based access.
2. Admin dashboard: KPI summary and recent activity.
3. Clients CRUD with archive/delete options.
4. Projects CRUD linked to clients.
5. Project updates, lightweight milestones/deliverables, notes, and activity timeline.
6. Client portal with project visibility, updates, files, key dates, and project notes.
7. Client invites by email with pending invite management.
8. Lightweight email notifications for invite, update, file, and comment events.
9. Global search for clients/projects.

## Current Implementation Status
- Done: Email/password auth, GitHub sign-in, Google sign-in wiring, role-based redirects, and invite-only client onboarding.
- Done: Admin dashboard, clients list/detail, projects list/detail, settings, users, and client portal routes are built and connected to real API data.
- Done: API routes are running through TanStack Start with Drizzle + Turso persistence for users, clients, projects, notes, sessions, and invites.
- Done: Global search across clients and projects.
- Done: In-app admin user management for listing users, changing roles, and deleting non-self accounts.
- Done: Project notes, collaboration activity, and file uploads/downloads are wired through database-backed project views for admins and clients.
- Done: Dashboard recent activity is backed by real client, project, project note, and file events.
- Done: Protected route navigation now uses route-level pending skeletons so authenticated pages can render immediate loading states during data fetches.
- Done: Automated coverage exists for protected-route pending-state navigation.
- Current: Complete admin clients CRUD with create, edit, archive, and delete flows in the UI.
- Current: Complete admin projects CRUD with create, edit, delete, and status update flows in the UI.
- Next: Improve client detail with linked projects, pending invite visibility, and primary admin actions.
- Next: Add first-class project updates or status reports plus lightweight milestones/deliverables.
- Next: Improve the client portal so clients can quickly see active work, latest updates, key dates, files, and discussion.
- Not started: Pending invite visibility, resend invite, and revoke invite management.
- Not started: Lightweight email notifications for invite, project update, file, and comment events.
- Not started: Automated auth/invite flow coverage and broader end-to-end test coverage.
- Not started: Production runtime validation for auth callbacks, cookies, Turso, UploadThing, and OAuth configuration.

## Routes
### Public
- `/login`
- `/signup`

### Admin
- `/dashboard`
- `/clients`
- `/clients/:id`
- `/projects`
- `/settings`

### Client Portal
- `/portal`
- `/portal/projects`
- `/portal/projects/:id`

## Data Model
- `users`
- `clients`
- `client_users`
- `projects`
- planned: `project_updates`
- planned: `project_milestones`
- `project_notes` stores project notes authored by admins and clients.
- `files`

## Architecture
- **Frontend**: TanStack Start + React + Tailwind + shadcn/ui
- **Backend**: TanStack Start server routes
- **Database**: Turso (SQLite)
- **ORM**: Drizzle
- **Auth**: Better Auth
- **Validation**: Zod
- **Runtime**: Bun
