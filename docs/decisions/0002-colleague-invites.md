# ADR 0002: Client-initiated colleague invites

**Status:** Accepted — Option A implemented
**Date:** 2026-06-21  
**Context:** Audit at `b44e631`; wiring re-verified 2026-06-21

## Context

Portal clients can invite colleagues to share their client workspace. The feature
is **partially complete** with a user-facing bug in the email timing.

### Wiring inventory

| Step | File:line | Behavior |
|------|-----------|----------|
| Schema | `src/db/schema.ts:133-137` | `invites.initiatedByClientId`, `invites.adminApprovedAt` |
| Client creates invite | `src/routes/api/portal/team.ts:62-68` | `createPortalColleagueInvite` with `initiatedByClientId: team.clientId` |
| **Email sent immediately** | `src/routes/api/portal/team.ts:77-84` | `sendInviteEmail` on POST — before any approval |
| Portal copy (approval-gated) | `src/routes/portal/team.tsx:83,107` | UI says invite is sent *after admin approves* |
| Redeem gated | `src/db/records.ts:1756-1758` | `getActiveInviteByToken` requires `adminApprovedAt` when `initiatedByClientId` is set |
| Consume gated | `src/db/records.ts:1784-1786` | Same clause in `consumeInvite` |
| Approval API | `src/routes/api/invites/$id/approve.ts:20` | `approveInviteRecord` sets `adminApprovedAt`, re-sends email |
| **Admin approval UI** | `src/routes/clients/$id.tsx:679-725` | `InviteRow` shows "Awaiting Approval" badge + Approve button for `initiatedByClientId && !adminApprovedAt` |

**Drift since original audit:** An admin approval surface **does exist** on the
client detail page (`PendingInvitesPanel` / `InviteRow`). The original plan
claimed it was missing; that is no longer accurate.

### The remaining bug

Regardless of UI completeness, **creation still emails a dead link**:

1. Client POSTs → invite row created, **email sent immediately**.
2. Recipient clicks link → `getActiveInviteByToken` returns `null` (not approved).
3. Admin approves later → approval route **re-sends** a working email.

Users who only read the first email get a broken experience. Portal copy correctly
describes approval-gated delivery, but the server contradicts it.

### Security note

Colleague invites flow through the same redeem path as admin invites. Plan 001
forces `role: client` on Better Auth signup; no privilege-escalation path found.

The approve route (`/api/invites/$id/approve`) is used for **all** pending invites
on a client, not colleague-only — Option B must not delete it.

## Option A — Complete the feature

**Effort:** M

1. **Fix email timing** (`src/routes/api/portal/team.ts`):
   - Remove `sendInviteEmail` from POST creation.
   - On creation, notify admin (new lightweight notification or dashboard signal)
     that approval is pending.
   - Keep email send on `src/routes/api/invites/$id/approve.ts` (already re-sends).

2. **Align resend behavior** (`src/routes/api/invites/$id/resend.ts`):
   - Block or no-op resend for unapproved colleague invites (or resend admin
     notification instead of client email).

3. **Tests** (`src/__tests__/invite-lifecycle.test.ts` or new API test):
   - Colleague invite: token inactive until `approveInviteRecord`, active after.
   - No email on create (mock `sendInviteEmail`).

4. **Copy** (`src/routes/portal/team.tsx`): Already correct; no change needed.

**Files touched:** `portal/team.ts`, `invites/$id/resend.ts`, `notifications.ts`,
one test file.

## Option B — Remove the feature

**Effort:** S

1. Remove POST handler branch in `src/routes/api/portal/team.ts` (keep GET team
   listing).
2. Remove `createPortalColleagueInvite` from data layer.
3. Migration: drop `initiated_by_client_id`, `admin_approved_at` columns; simplify
   `getActiveInviteByToken` / `consumeInvite` (remove approval `or` clause).
4. Remove approval UI branch in `src/routes/clients/$id.tsx` (`isAwaitingApproval`).
5. Update `src/routes/portal/team.tsx` — remove colleague-invite form/copy.

**Do not remove** `approveInviteRecord` or `/api/invites/$id/approve` — used for
standard admin invites.

**Migration blast radius:** `invites` table columns, redeem queries, portal team
UI, client detail invite row, API types in `src/lib/api.ts`.

## Recommendation

**Option A (complete)** with the email-timing fix only is the smallest path to a
coherent feature. The admin UI already exists; the main gap is **server behavior
matching the UI promise**. This aligns with `PRD.md` item 7 (client invites) and
the lightweight scope.

Option B is defensible if the team wants **less surface area at launch** and is
willing to drop colleague self-service invites entirely (admin-only invites remain).

## Immediate action (regardless of A/B)

At minimum before launch, **stop sending the broken first email** on colleague-invite
creation — either move send to approval (Option A) or disable POST (Option B). The
current state ships contradictory copy *and* a dead link.