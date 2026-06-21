# ADR 0001: Multi-tenancy direction

**Status:** Proposed — awaiting maintainer decision  
**Date:** 2026-06-21  
**Context:** Commit series through plan 007; audit at `b44e631`

## Context

Clientra is mid-migration between a **single-operator workspace** (the `PRD.md`
model: one admin + their clients) and **multi-tenant agencies** (Better Auth
`organization` plugin, org-scoped columns, partial query filtering). The app is
neither cleanly single-tenant nor safely multi-tenant today.

### Schema & auth (org infrastructure present)

| Location | What exists |
|----------|-------------|
| `src/db/schema.ts` | `clients.organizationId`, `clientUsers.organizationId`, `session.activeOrganizationId`, full `organization` / `member` / `invitation` tables |
| `src/auth/better-auth.ts:201-227` | `organization()` plugin, `allowUserToCreateOrganization: true`, org invitation emails |
| `src/auth/roles.ts:9` | `SessionUser.activeOrganizationId` |
| `src/auth/guards.ts:25,43,71` | Admin redirects depend on `activeOrganizationId` (onboarding vs dashboard) |

### Org-aware paths (filter or stamp `organizationId`)

| File:line | Behavior |
|-----------|----------|
| `src/db/records.ts:904-910` | `listClientsForUser` — admin lists clients where `organizationId === activeOrganizationId` |
| `src/db/records.ts:991-998` | `listProjectsForUser` — admin projects scoped via client join on `organizationId` |
| `src/db/records.ts:1632-1640` | `searchRecords` — admin project search filtered by org |
| `src/db/records.ts:1669-1677` | `searchRecords` — admin client search filtered by org |
| `src/db/records.ts:1920-1934` | `listUsersForAdmin` — members + client users for org |
| `src/routes/api/clients.ts:38-45` | POST client requires `activeOrganizationId`, stamps `organizationId` |
| `src/routes/api/dashboard/activity.ts:21-26` | Dashboard activity requires `activeOrganizationId` |
| `src/routes/api/users.ts:22` | User list passes `activeOrganizationId` |

### Org-blind paths (admin mutation by record id, no org check)

These use `requireAdminMutationRequest` but do **not** verify the target record
belongs to the admin's `activeOrganizationId`:

| Route | File |
|-------|------|
| PATCH/DELETE client | `src/routes/api/clients/$id.ts` |
| POST project | `src/routes/api/projects.ts:29-48` (no org stamp on project) |
| PATCH/DELETE project | `src/routes/api/projects/$id.ts` |
| Project updates CRUD | `src/routes/api/projects/$id/updates.ts`, `src/routes/api/project-updates/$id.ts` |
| Project milestones CRUD | `src/routes/api/projects/$id/milestones.ts`, `src/routes/api/project-milestones/$id.ts` |
| File delete | `src/routes/api/files/$id.ts` |
| Invites create/resend/revoke/approve | `src/routes/api/invites.ts`, `src/routes/api/invites/$id/*.ts` |
| Status change review | `src/routes/api/admin/status-change-requests/$id.ts` |
| User role/delete | `src/routes/api/users/$id.ts` |
| Settings | `src/routes/api/settings.ts` |

An isolation check on each would compare the record's `organizationId` (directly
on `clients`, or via `projects.clientId → clients.organizationId`) against
`auth.user.activeOrganizationId`.

### Intended product model

`PRD.md` describes a **single Admin persona** managing their clients — not
enterprise multi-agency CRM. `phases.md` does not list multi-tenancy as a launch
goal. Normal operation seeds **one admin** (`seedIfEmpty`); everyone else is
`client`. There is effectively **one tenant in production today**.

**Open question for maintainer:** Is a second independent agency workspace a
near-term product goal, or was the org plugin added for future optionality?

## Option A — Remove or freeze multi-tenancy

**Effort:** M (schema migration + auth simplification)

**Actions:**

- Remove or stop using the Better Auth `organization()` plugin and worker-invite
  flow (`/invite/worker/:token`).
- Drop nullable `organizationId` columns (or leave nullable but stop writing them).
- Remove `activeOrganizationId` from session-dependent redirects; simplify
  onboarding.
- Delete or archive `organization`, `member`, `invitation` tables via migration.
- Simplify `listClientsForUser` / `searchRecords` to admin-sees-all (single tenant).

**Gains:** Less dead schema, fewer partial code paths, no false sense of isolation.

**Blast radius:** Migration touches auth tables, seed data, guards, and every
org-filtered query. Verify session creation does not depend on an active org
(load-bearing check before deleting).

## Option B — Finish multi-tenancy

**Effort:** L (enforcement pass + UX + tests)

**Actions:**

- Add org-ownership checks to every org-blind admin route listed above.
- Stamp `organizationId` on project creation (derive from `clientId`).
- Org-switch UI for admins with multiple memberships.
- Org-scoped seeding (no hardcoded org id).
- Cross-org isolation integration tests (extend plan 005 access-control suite).
- Revisit indexes: composite `(organizationId, …)` per plan 004 maintenance note.

**Gains:** True workspace isolation if multiple agencies are a product goal.

**Risk:** Incomplete enforcement is worse than no enforcement — every blind path
must be closed before launch.

## Recommendation

**Option A (freeze/remove)** is the lower-risk path for launch given the PRD's
single-operator model and lightweight non-goals. The org plugin and columns look
like **premature infrastructure** — they add maintenance surface without a stated
product requirement.

If the maintainer expects multiple agency workspaces soon, choose Option B and
treat it as a **launch blocker** (not a post-launch nice-to-have).

## Consequences

| Decision | Follow-up |
|----------|-----------|
| Option A | Simplify data layer; plan 006+ splits proceed without org scoping in every module |
| Option B | Block launch until org-blind routes are enumerated and tested; add cross-org cases to `access-control.test.ts` |