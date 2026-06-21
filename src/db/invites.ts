import { and, desc, eq, gt, isNotNull, isNull, or } from "drizzle-orm";
import type { SessionUser } from "@/auth/roles";
import { db } from "./client";
import {
  clients as clientsTable,
  clientUsers as clientUsersTable,
  invites as invitesTable,
  users as usersTable,
} from "./schema";

type DatabaseExecutor = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

interface InviteInsert {
  clientId: string;
  email: string;
  expiresAt: Date;
  id: string;
  token: string;
}

function mapInvite(row: typeof invitesTable.$inferSelect) {
  return {
    adminApprovedAt: row.adminApprovedAt,
    clientId: row.clientId,
    consumedAt: row.consumedAt,
    createdAt: row.createdAt,
    email: row.email,
    expiresAt: row.expiresAt,
    id: row.id,
    initiatedByClientId: row.initiatedByClientId,
    revokedAt: row.revokedAt,
    token: row.token,
  };
}

export async function createInviteRecord(input: InviteInsert) {
  await db.insert(invitesTable).values({
    clientId: input.clientId,
    consumedAt: null,
    createdAt: new Date(),
    email: input.email,
    expiresAt: input.expiresAt,
    id: input.id,
    revokedAt: null,
    token: input.token,
  });
}

export async function getInviteRecordById(id: string) {
  const [created] = await db
    .select()
    .from(invitesTable)
    .where(eq(invitesTable.id, id))
    .limit(1);

  return created ? mapInvite(created) : null;
}

export async function getActiveInviteByToken(token: string) {
  const [invite] = await db
    .select()
    .from(invitesTable)
    .where(
      and(
        eq(invitesTable.token, token),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date()),
        or(
          isNull(invitesTable.initiatedByClientId),
          isNotNull(invitesTable.adminApprovedAt)
        )
      )
    )
    .limit(1);

  if (!invite) {
    return null;
  }

  return mapInvite(invite);
}

export async function consumeInvite(
  token: string,
  executor: DatabaseExecutor = db
) {
  const consumedInvites = await executor
    .update(invitesTable)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(invitesTable.token, token),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date()),
        or(
          isNull(invitesTable.initiatedByClientId),
          isNotNull(invitesTable.adminApprovedAt)
        )
      )
    )
    .returning({ token: invitesTable.token });

  return consumedInvites.length > 0;
}

export async function getActiveInviteById(inviteId: string) {
  const [invite] = await db
    .select()
    .from(invitesTable)
    .where(
      and(
        eq(invitesTable.id, inviteId),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .limit(1);

  return invite ? mapInvite(invite) : null;
}

export async function refreshInviteExpiration(
  inviteId: string,
  expiresAt: Date
) {
  const [invite] = await db
    .update(invitesTable)
    .set({ expiresAt })
    .where(
      and(
        eq(invitesTable.id, inviteId),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .returning();

  return invite ? mapInvite(invite) : null;
}

export async function approveInviteRecord(inviteId: string) {
  const [invite] = await db
    .update(invitesTable)
    .set({ adminApprovedAt: new Date() })
    .where(
      and(
        eq(invitesTable.id, inviteId),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .returning();

  return invite ? mapInvite(invite) : null;
}

export async function revokeInviteRecord(inviteId: string) {
  const [invite] = await db
    .update(invitesTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(invitesTable.id, inviteId),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .returning();

  return invite ? mapInvite(invite) : null;
}

export async function linkUserToClient(
  clientId: string,
  userId: string,
  executor: DatabaseExecutor = db
) {
  const [client] = await executor
    .select({ organizationId: clientsTable.organizationId })
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);

  await executor
    .insert(clientUsersTable)
    .values({
      clientId,
      id: crypto.randomUUID(),
      organizationId: client?.organizationId ?? null,
      userId,
    })
    .onConflictDoNothing();
}

export async function listPendingInvitesForClient(clientId: string) {
  const rows = await db
    .select()
    .from(invitesTable)
    .where(
      and(
        eq(invitesTable.clientId, clientId),
        isNull(invitesTable.consumedAt),
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .orderBy(desc(invitesTable.createdAt));

  return rows.map(mapInvite);
}

export async function createPortalColleagueInvite(input: {
  clientId: string;
  email: string;
  id: string;
  initiatedByClientId: string;
  token: string;
}) {
  await db.insert(invitesTable).values({
    clientId: input.clientId,
    createdAt: new Date(),
    email: input.email,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    id: input.id,
    initiatedByClientId: input.initiatedByClientId,
    token: input.token,
  });

  return getInviteRecordById(input.id);
}

export async function listPortalTeam(user: SessionUser) {
  const [clientUser] = await db
    .select({ client: clientsTable })
    .from(clientUsersTable)
    .innerJoin(clientsTable, eq(clientUsersTable.clientId, clientsTable.id))
    .where(eq(clientUsersTable.userId, user.id))
    .limit(1);

  if (!clientUser) {
    return { clientId: null, members: [], pendingInvites: [] };
  }

  const clientId = clientUser.client.id;

  const [members, pendingInvites] = await Promise.all([
    db
      .select({ user: usersTable })
      .from(clientUsersTable)
      .innerJoin(usersTable, eq(clientUsersTable.userId, usersTable.id))
      .where(eq(clientUsersTable.clientId, clientId)),
    db
      .select()
      .from(invitesTable)
      .where(
        and(
          eq(invitesTable.clientId, clientId),
          isNull(invitesTable.consumedAt),
          isNull(invitesTable.revokedAt),
          gt(invitesTable.expiresAt, new Date())
        )
      )
      .orderBy(desc(invitesTable.createdAt)),
  ]);

  return {
    clientId,
    members: members.map(({ user }) => ({
      createdAt: user.createdAt.toISOString(),
      email: user.email,
      id: user.id,
      image: user.image,
      name: user.name,
      role: user.role,
    })),
    pendingInvites: pendingInvites.map((invite) => ({
      adminApprovedAt: invite.adminApprovedAt?.toISOString() ?? null,
      clientId: invite.clientId,
      createdAt: invite.createdAt.toISOString(),
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      id: invite.id,
      initiatedByClientId: invite.initiatedByClientId,
    })),
  };
}
