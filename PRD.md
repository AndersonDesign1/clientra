# Clientra Product Requirements Document

## Product Summary
Clientra is a lightweight client and project management system for freelancers, developers, and small agencies. It is intentionally not a full CRM and focuses on speed, clarity, and minimal workflows.

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

## Core Features
1. Authentication (email/password) with role-based access.
2. Admin dashboard: KPI summary and recent activity.
3. Clients CRUD with archive/delete options.
4. Projects CRUD linked to clients.
5. Project notes/activity timeline.
6. Client portal with project visibility, updates, files, comments.
7. Client invites by email.
8. Global search for clients/projects.

## Current Implementation Status
- Done: Email/password auth, GitHub sign-in, Google sign-in wiring, role-based redirects, and invite-only client onboarding.
- Done: Admin dashboard, clients list/detail, projects list, settings, and client portal routes are built and connected to real API data.
- Done: API routes are running through TanStack Start with Drizzle + Turso persistence for users, clients, projects, notes, sessions, and invites.
- Done: Global search across clients and projects.
- Ongoing: Dashboard recent activity and some timeline-style UI sections still rely on placeholder content.
- Ongoing: Notes exist at the API/data layer, but richer collaboration history and UX are still limited.
- Not started: File upload/storage flows in the client portal.
- Not started: Comment threads and richer client collaboration features.
- Not started: In-app admin user management and role management UI.
- Not started: Automated end-to-end test coverage.

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
- `project_notes`
- `files`

## Architecture
- **Frontend**: TanStack Start + React + Tailwind + shadcn/ui
- **Backend**: TanStack Start server routes
- **Database**: Turso (SQLite)
- **ORM**: Drizzle
- **Auth**: Better Auth
- **Validation**: Zod
- **Runtime**: Bun
