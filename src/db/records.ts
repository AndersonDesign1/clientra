import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { ROLES, type SessionUser } from "@/auth/roles";
import { db } from "./client";
import {
  accounts as accountsTable,
  clients as clientsTable,
  clientUsers as clientUsersTable,
  files as filesTable,
  invites as invitesTable,
  projectNotes as projectNotesTable,
  projects as projectsTable,
  users as usersTable,
} from "./schema";

type DatabaseExecutor = Pick<
  typeof db,
  "delete" | "insert" | "select" | "transaction" | "update"
>;

interface ClientInsert {
  company: string;
  email: string;
  id: string;
  name: string;
  notes?: string;
  phone?: string;
  status: "active" | "archived";
  tags: string[];
  website?: string;
}

interface ProjectInsert {
  budget: number;
  clientId: string;
  deadline?: string;
  description?: string;
  id: string;
  status: "planning" | "in_progress" | "completed";
  title: string;
}

interface NoteInsert {
  content: string;
  id: string;
  projectId: string;
  userId: string;
}

interface ProjectFileInsert {
  createdAt?: Date;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  id: string;
  mimeType: string;
  projectId: string;
  storageKey: string;
  uploadedBy: string;
}

interface InviteInsert {
  clientId: string;
  email: string;
  expiresAt: Date;
  id: string;
  token: string;
}

interface ManagedUser {
  createdAt: Date;
  email: string;
  emailVerified: boolean;
  id: string;
  image: string | null;
  name: string;
  providers: string[];
  role: "admin" | "client";
}

interface ProjectFileRecord extends Record<string, unknown> {
  createdAt: Date;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  id: string;
  mimeType: string;
  projectId: string;
  storageKey: string;
  uploadedBy: string;
  uploaderName: string;
}

export type PublicProjectFile = {
  createdAt: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  id: string;
  mimeType: string;
  projectId: string;
  uploadedBy: string;
  uploaderName: string;
} & Record<string, string | number>;

function serializeTags(tags: string[]) {
  return JSON.stringify(tags);
}

function escapeLikePattern(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

function parseTags(tags: string | null) {
  if (!tags) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function mapClient(row: typeof clientsTable.$inferSelect) {
  return {
    company: row.company,
    email: row.email,
    id: row.id,
    name: row.name,
    notes: row.notes ?? "",
    phone: row.phone ?? "",
    status: row.status,
    tags: parseTags(row.tags),
    website: row.website ?? "",
  };
}

function mapProject(row: typeof projectsTable.$inferSelect) {
  return {
    budget: row.budget,
    clientId: row.clientId,
    deadline: row.deadline ?? "",
    description: row.description ?? "",
    id: row.id,
    status: row.status,
    title: row.title,
  };
}

function mapInvite(row: typeof invitesTable.$inferSelect) {
  return {
    clientId: row.clientId,
    consumedAt: row.consumedAt,
    createdAt: row.createdAt,
    email: row.email,
    expiresAt: row.expiresAt,
    id: row.id,
    token: row.token,
  };
}

function mapManagedUser(
  row: typeof usersTable.$inferSelect,
  providers: string[]
): ManagedUser {
  return {
    createdAt: row.createdAt,
    email: row.email,
    emailVerified: row.emailVerified,
    id: row.id,
    image: row.image,
    name: row.name,
    providers,
    role: row.role,
  };
}

function mapProjectFile(
  row: typeof filesTable.$inferSelect,
  uploaderName: string | null
): ProjectFileRecord {
  return {
    createdAt: row.createdAt,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fileUrl: row.fileUrl,
    id: row.id,
    mimeType: row.mimeType,
    projectId: row.projectId,
    storageKey: row.storageKey,
    uploadedBy: row.uploadedBy,
    uploaderName: uploaderName ?? "",
  };
}

export function serializeProjectFile(
  file: ProjectFileRecord
): PublicProjectFile {
  return {
    createdAt: file.createdAt.toISOString(),
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileUrl: file.fileUrl,
    id: file.id,
    mimeType: file.mimeType,
    projectId: file.projectId,
    uploadedBy: file.uploadedBy,
    uploaderName: file.uploaderName,
  };
}

export async function checkDatabaseHealth() {
  await db.run(sql`select 1`);
}

export async function listClients() {
  const rows = await db
    .select()
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt));

  return rows.map(mapClient);
}

export async function listClientsForUser(user: SessionUser) {
  if (user.role === ROLES.ADMIN) {
    return listClients();
  }

  const linkedClientRows = await db
    .select({ client: clientsTable })
    .from(clientUsersTable)
    .innerJoin(clientsTable, eq(clientUsersTable.clientId, clientsTable.id))
    .where(eq(clientUsersTable.userId, user.id))
    .orderBy(desc(clientsTable.createdAt));

  return linkedClientRows.map(({ client }) => mapClient(client));
}

export async function createClientRecord(input: ClientInsert) {
  await db.insert(clientsTable).values({
    company: input.company,
    createdAt: new Date(),
    email: input.email,
    id: input.id,
    name: input.name,
    notes: input.notes ?? "",
    phone: input.phone ?? "",
    status: input.status,
    tags: serializeTags(input.tags),
    website: input.website ?? "",
  });

  const [created] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, input.id))
    .limit(1);

  return created ? mapClient(created) : null;
}

export async function listProjects() {
  const rows = await db
    .select()
    .from(projectsTable)
    .orderBy(desc(projectsTable.createdAt));

  return rows.map(mapProject);
}

export async function listProjectsForUser(user: SessionUser) {
  if (user.role === ROLES.ADMIN) {
    return listProjects();
  }

  const linkedProjects = await db
    .select({ project: projectsTable })
    .from(clientUsersTable)
    .innerJoin(
      projectsTable,
      eq(projectsTable.clientId, clientUsersTable.clientId)
    )
    .where(eq(clientUsersTable.userId, user.id))
    .orderBy(desc(projectsTable.createdAt));

  return linkedProjects.map(({ project }) => mapProject(project));
}

export async function createProjectRecord(input: ProjectInsert) {
  await db.insert(projectsTable).values({
    budget: input.budget,
    clientId: input.clientId,
    createdAt: new Date(),
    deadline: input.deadline ?? "",
    description: input.description ?? "",
    id: input.id,
    status: input.status,
    title: input.title,
  });

  const [created] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, input.id))
    .limit(1);

  return created ? mapProject(created) : null;
}

export async function createProjectNoteRecord(input: NoteInsert) {
  await db.insert(projectNotesTable).values({
    content: input.content,
    createdAt: new Date(),
    id: input.id,
    projectId: input.projectId,
    userId: input.userId,
  });

  const [created] = await db
    .select()
    .from(projectNotesTable)
    .where(eq(projectNotesTable.id, input.id))
    .limit(1);

  return created ?? null;
}

export async function createProjectFileRecord(input: ProjectFileInsert) {
  await db.insert(filesTable).values({
    createdAt: input.createdAt ?? new Date(),
    fileName: input.fileName,
    fileSize: input.fileSize,
    fileUrl: input.fileUrl,
    id: input.id,
    mimeType: input.mimeType,
    projectId: input.projectId,
    storageKey: input.storageKey,
    uploadedBy: input.uploadedBy,
  });

  const [created] = await db
    .select({
      file: filesTable,
      uploaderName: usersTable.name,
    })
    .from(filesTable)
    .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
    .where(eq(filesTable.id, input.id))
    .limit(1);

  return created ? mapProjectFile(created.file, created.uploaderName) : null;
}

export async function canAccessProject(user: SessionUser, projectId: string) {
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  const [match] = await db
    .select({ projectId: projectsTable.id })
    .from(clientUsersTable)
    .innerJoin(
      projectsTable,
      eq(projectsTable.clientId, clientUsersTable.clientId)
    )
    .where(
      and(eq(clientUsersTable.userId, user.id), eq(projectsTable.id, projectId))
    )
    .limit(1);

  return Boolean(match);
}

export async function listProjectFilesForUser(
  projectId: string,
  user: SessionUser
) {
  const hasAccess = await canAccessProject(user, projectId);

  if (!hasAccess) {
    return null;
  }

  const rows = await db
    .select({
      file: filesTable,
      uploaderName: usersTable.name,
    })
    .from(filesTable)
    .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
    .where(eq(filesTable.projectId, projectId))
    .orderBy(desc(filesTable.createdAt));

  return rows.map(({ file, uploaderName }) =>
    mapProjectFile(file, uploaderName)
  );
}

export async function getProjectFileById(fileId: string) {
  const [file] = await db
    .select({
      file: filesTable,
      uploaderName: usersTable.name,
    })
    .from(filesTable)
    .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
    .where(eq(filesTable.id, fileId))
    .limit(1);

  return file ? mapProjectFile(file.file, file.uploaderName) : null;
}

export async function deleteProjectFileRecord(fileId: string) {
  const deletedFiles = await db
    .delete(filesTable)
    .where(eq(filesTable.id, fileId))
    .returning();

  return deletedFiles[0] ?? null;
}

export async function restoreProjectFileRecord(file: {
  createdAt: Date;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  id: string;
  mimeType: string;
  projectId: string;
  storageKey: string;
  uploadedBy: string;
}) {
  await db.insert(filesTable).values({
    createdAt: file.createdAt,
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileUrl: file.fileUrl,
    id: file.id,
    mimeType: file.mimeType,
    projectId: file.projectId,
    storageKey: file.storageKey,
    uploadedBy: file.uploadedBy,
  });
}

export async function searchRecords(query: string, user: SessionUser) {
  const normalized = `%${escapeLikePattern(query.toLowerCase())}%`;
  const projectWhere =
    user.role === ROLES.ADMIN
      ? sql`lower(${projectsTable.title}) like ${normalized} escape '\\'`
      : sql`lower(${projectsTable.title}) like ${normalized} escape '\\' and ${projectsTable.clientId} in (
          select ${clientUsersTable.clientId}
          from ${clientUsersTable}
          where ${clientUsersTable.userId} = ${user.id}
        )`;

  const matchedProjects = await db
    .select()
    .from(projectsTable)
    .where(projectWhere)
    .orderBy(desc(projectsTable.createdAt));

  if (user.role === ROLES.ADMIN) {
    const matchedClients = await db
      .select()
      .from(clientsTable)
      .where(
        or(
          sql`lower(${clientsTable.name}) like ${normalized} escape '\\'`,
          sql`lower(${clientsTable.company}) like ${normalized} escape '\\'`
        )
      )
      .orderBy(desc(clientsTable.createdAt));

    return {
      clients: matchedClients.map(mapClient),
      projects: matchedProjects.map(mapProject),
    };
  }

  const matchedClients = await db
    .select({ row: clientsTable })
    .from(clientUsersTable)
    .innerJoin(clientsTable, eq(clientUsersTable.clientId, clientsTable.id))
    .where(
      and(
        eq(clientUsersTable.userId, user.id),
        or(
          sql`lower(${clientsTable.name}) like ${normalized} escape '\\'`,
          sql`lower(${clientsTable.company}) like ${normalized} escape '\\'`
        )
      )
    )
    .orderBy(desc(clientsTable.createdAt));

  return {
    clients: matchedClients.map(({ row }) => mapClient(row)),
    projects: matchedProjects.map(mapProject),
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
        gt(invitesTable.expiresAt, new Date())
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
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .returning({ token: invitesTable.token });

  return consumedInvites.length > 0;
}

export async function linkUserToClient(
  clientId: string,
  userId: string,
  executor: DatabaseExecutor = db
) {
  await executor
    .insert(clientUsersTable)
    .values({
      clientId,
      id: crypto.randomUUID(),
      userId,
    })
    .onConflictDoNothing();
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "client",
  executor: DatabaseExecutor = db
) {
  await executor
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));
}

export async function promoteUserToInitialAdmin(userId: string) {
  const promotedUsers = await db
    .update(usersTable)
    .set({ role: ROLES.ADMIN, updatedAt: new Date() })
    .where(
      and(
        eq(usersTable.id, userId),
        eq(usersTable.role, ROLES.CLIENT),
        sql`not exists (
          select 1
          from ${usersTable}
          where ${usersTable.role} = ${ROLES.ADMIN}
            and ${usersTable.id} <> ${userId}
        )`
      )
    )
    .returning({ id: usersTable.id });

  return promotedUsers.length > 0;
}

export async function listUsersForAdmin() {
  const [userRows, accountRows] = await Promise.all([
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)),
    db
      .select({
        providerId: accountsTable.providerId,
        userId: accountsTable.userId,
      })
      .from(accountsTable),
  ]);

  const providersByUserId = new Map<string, string[]>();

  for (const account of accountRows) {
    const current = providersByUserId.get(account.userId) ?? [];

    if (!current.includes(account.providerId)) {
      current.push(account.providerId);
      providersByUserId.set(account.userId, current);
    }
  }

  return userRows.map((row) =>
    mapManagedUser(row, providersByUserId.get(row.id) ?? [])
  );
}

export async function hasWorkspaceAdmin() {
  const [admin] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.role, ROLES.ADMIN))
    .limit(1);

  return Boolean(admin);
}

export async function setUserRole(userId: string, role: "admin" | "client") {
  const updatedRows = await db
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  const updated = updatedRows[0];

  if (!updated) {
    return null;
  }

  const linkedAccounts = await db
    .select({ providerId: accountsTable.providerId })
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId));

  return mapManagedUser(
    updated,
    linkedAccounts.map((account) => account.providerId)
  );
}

export function deleteUserById(userId: string) {
  return db.transaction(async (tx) => {
    const deletedUsers = await tx
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id });

    return deletedUsers.length > 0;
  });
}

export async function listPendingInvitesForClient(clientId: string) {
  const rows = await db
    .select()
    .from(invitesTable)
    .where(
      and(
        eq(invitesTable.clientId, clientId),
        isNull(invitesTable.consumedAt),
        gt(invitesTable.expiresAt, new Date())
      )
    )
    .orderBy(desc(invitesTable.createdAt));

  return rows.map(mapInvite);
}

export async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clientsTable);

  if (count > 0) {
    return;
  }

  const now = new Date();

  await db.insert(clientsTable).values([
    {
      company: "Acme Inc.",
      createdAt: now,
      email: "jordan@acme.co",
      id: "cli_1",
      name: "Jordan Lee",
      notes: "Primary stakeholder for website refresh.",
      phone: "+1 555-0101",
      status: "active",
      tags: serializeTags(["retainer", "web"]),
      website: "https://acme.co",
    },
    {
      company: "Northstar Labs",
      createdAt: now,
      email: "avery@northstar.dev",
      id: "cli_2",
      name: "Avery Stone",
      notes: "Prefers weekly async updates.",
      phone: "+1 555-0199",
      status: "active",
      tags: serializeTags(["mobile"]),
      website: "https://northstar.dev",
    },
  ]);

  await db.insert(projectsTable).values([
    {
      budget: 12_000,
      clientId: "cli_1",
      createdAt: now,
      deadline: "2026-04-10",
      description: "Modernize IA, design system, and page templates.",
      id: "proj_1",
      status: "in_progress",
      title: "Marketing Site Redesign",
    },
    {
      budget: 18_000,
      clientId: "cli_2",
      createdAt: now,
      deadline: "2026-05-20",
      description: "Client-facing project status and messaging app.",
      id: "proj_2",
      status: "planning",
      title: "iOS Client Portal",
    },
  ]);
}
