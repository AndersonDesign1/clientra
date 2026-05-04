import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { ROLES, type Role, type SessionUser } from "@/auth/roles";
import { getClientPathParam } from "@/lib/client-slugs";
import { getProjectSlug } from "@/lib/project-slugs";
import type {
  NotificationRecipient,
  ProjectNotificationContext,
} from "@/server/email/notifications";
import type { DashboardActivityEvent } from "@/shared/dashboard-activity";
import { db } from "./client";
import {
  accounts as accountsTable,
  clients as clientsTable,
  clientUsers as clientUsersTable,
  files as filesTable,
  invites as invitesTable,
  projectMilestones as projectMilestonesTable,
  projectNotes as projectNotesTable,
  projects as projectsTable,
  projectUpdates as projectUpdatesTable,
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

interface ProjectUpdateInsert {
  authorId: string;
  body: string;
  id: string;
  projectId: string;
  status: "on_track" | "at_risk" | "blocked" | "complete";
  title: string;
}

interface ProjectUpdatePatch {
  body: string;
  status: "on_track" | "at_risk" | "blocked" | "complete";
  title: string;
}

interface ProjectMilestoneInsert {
  description?: string;
  dueDate?: string;
  id: string;
  projectId: string;
  sortOrder: number;
  status: "todo" | "in_progress" | "done";
  title: string;
}

interface ProjectMilestonePatch {
  description?: string;
  dueDate?: string;
  sortOrder: number;
  status: "todo" | "in_progress" | "done";
  title: string;
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

interface PortalProjectRecord extends ReturnType<typeof mapProject> {
  clientCompany: string;
  clientName: string;
  clientSlug: string;
}

interface ProjectCommentRecord extends Record<string, unknown> {
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: Date;
  id: string;
  projectId: string;
}

interface ProjectUpdateRecord extends Record<string, unknown> {
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  id: string;
  projectId: string;
  status: "on_track" | "at_risk" | "blocked" | "complete";
  title: string;
  updatedAt: Date;
}

interface ProjectMilestoneRecord extends Record<string, unknown> {
  createdAt: Date;
  description: string;
  dueDate: string;
  id: string;
  projectId: string;
  sortOrder: number;
  status: "todo" | "in_progress" | "done";
  title: string;
  updatedAt: Date;
}

export class DuplicateProjectSlugError extends Error {
  constructor() {
    super("A project with this name already exists for this client.");
    this.name = "DuplicateProjectSlugError";
  }
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

export interface PublicProjectComment {
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  id: string;
  projectId: string;
}

export type PublicProjectActivityEvent =
  | {
      createdAt: string;
      id: string;
      type: "project_created";
    }
  | {
      authorId: string;
      authorName: string;
      authorRole: Role;
      contentPreview: string;
      createdAt: string;
      id: string;
      type: "note_added";
    }
  | {
      authorId: string;
      authorName: string;
      createdAt: string;
      fileId: string;
      fileName: string;
      id: string;
      type: "file_uploaded";
    }
  | {
      authorId: string;
      authorName: string;
      createdAt: string;
      id: string;
      status: "on_track" | "at_risk" | "blocked" | "complete";
      title: string;
      type: "project_update";
    };

export interface PublicProjectCollaboration {
  activity: PublicProjectActivityEvent[];
  comments: PublicProjectComment[];
}

export interface PublicProjectUpdate {
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  id: string;
  projectId: string;
  status: "on_track" | "at_risk" | "blocked" | "complete";
  title: string;
  updatedAt: string;
}

export interface PublicProjectMilestone {
  createdAt: string;
  description: string;
  dueDate: string;
  id: string;
  projectId: string;
  sortOrder: number;
  status: "todo" | "in_progress" | "done";
  title: string;
  updatedAt: string;
}

export type PublicDashboardActivityEvent = DashboardActivityEvent;

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
    slug: row.slug,
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
    revokedAt: row.revokedAt,
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

function mapProjectComment(
  row: typeof projectNotesTable.$inferSelect,
  authorName: string | null,
  authorRole: Role | null
): ProjectCommentRecord {
  return {
    authorId: row.userId,
    authorName: authorName ?? "Unknown user",
    authorRole: authorRole ?? ROLES.CLIENT,
    content: row.content,
    createdAt: row.createdAt,
    id: row.id,
    projectId: row.projectId,
  };
}

function mapProjectUpdate(
  row: typeof projectUpdatesTable.$inferSelect,
  authorName: string | null
): ProjectUpdateRecord {
  return {
    authorId: row.authorId,
    authorName: authorName ?? "Unknown user",
    body: row.body,
    createdAt: row.createdAt,
    id: row.id,
    projectId: row.projectId,
    status: row.status,
    title: row.title,
    updatedAt: row.updatedAt,
  };
}

function mapProjectMilestone(
  row: typeof projectMilestonesTable.$inferSelect
): ProjectMilestoneRecord {
  return {
    createdAt: row.createdAt,
    description: row.description ?? "",
    dueDate: row.dueDate ?? "",
    id: row.id,
    projectId: row.projectId,
    sortOrder: row.sortOrder,
    status: row.status,
    title: row.title,
    updatedAt: row.updatedAt,
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

export function serializeProjectComment(
  comment: ProjectCommentRecord
): PublicProjectComment {
  return {
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    id: comment.id,
    projectId: comment.projectId,
  };
}

export function serializeProjectUpdate(
  update: ProjectUpdateRecord
): PublicProjectUpdate {
  return {
    authorId: update.authorId,
    authorName: update.authorName,
    body: update.body,
    createdAt: update.createdAt.toISOString(),
    id: update.id,
    projectId: update.projectId,
    status: update.status,
    title: update.title,
    updatedAt: update.updatedAt.toISOString(),
  };
}

export function serializeProjectMilestone(
  milestone: ProjectMilestoneRecord
): PublicProjectMilestone {
  return {
    createdAt: milestone.createdAt.toISOString(),
    description: milestone.description,
    dueDate: milestone.dueDate,
    id: milestone.id,
    projectId: milestone.projectId,
    sortOrder: milestone.sortOrder,
    status: milestone.status,
    title: milestone.title,
    updatedAt: milestone.updatedAt.toISOString(),
  };
}

function truncateActivityContent(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}

function createProjectCreatedActivity(
  project: typeof projectsTable.$inferSelect
): PublicProjectActivityEvent {
  return {
    createdAt: project.createdAt.toISOString(),
    id: `project:${project.id}:created`,
    type: "project_created",
  };
}

function createNoteActivity(
  comment: ProjectCommentRecord
): PublicProjectActivityEvent {
  return {
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    contentPreview: truncateActivityContent(comment.content),
    createdAt: comment.createdAt.toISOString(),
    id: `note:${comment.id}`,
    type: "note_added",
  };
}

function createFileUploadedActivity(
  file: ProjectFileRecord
): PublicProjectActivityEvent {
  return {
    authorId: file.uploadedBy,
    authorName: file.uploaderName || "Unknown user",
    createdAt: file.createdAt.toISOString(),
    fileId: file.id,
    fileName: file.fileName,
    id: `file:${file.id}`,
    type: "file_uploaded",
  };
}

function createProjectUpdateActivity(
  update: ProjectUpdateRecord
): PublicProjectActivityEvent {
  return {
    authorId: update.authorId,
    authorName: update.authorName,
    createdAt: update.createdAt.toISOString(),
    id: `update:${update.id}`,
    status: update.status,
    title: update.title,
    type: "project_update",
  };
}

export function buildProjectActivityFeed({
  comments,
  files,
  project,
  updates = [],
}: {
  comments: ProjectCommentRecord[];
  files: ProjectFileRecord[];
  project: typeof projectsTable.$inferSelect;
  updates?: ProjectUpdateRecord[];
}): PublicProjectActivityEvent[] {
  return [
    createProjectCreatedActivity(project),
    ...comments.map(createNoteActivity),
    ...files.map(createFileUploadedActivity),
    ...updates.map(createProjectUpdateActivity),
  ].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);

    return rightTime - leftTime;
  });
}

export function buildDashboardActivityFeed({
  clients,
  comments,
  files,
  projects,
}: {
  clients: (typeof clientsTable.$inferSelect)[];
  comments: {
    authorName: string | null;
    note: typeof projectNotesTable.$inferSelect;
    projectTitle: string | null;
  }[];
  files: {
    file: typeof filesTable.$inferSelect;
    projectTitle: string | null;
    uploaderName: string | null;
  }[];
  projects: {
    clientName: string | null;
    project: typeof projectsTable.$inferSelect;
  }[];
}): PublicDashboardActivityEvent[] {
  return [
    ...clients.map((client) => ({
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      createdAt: client.createdAt.toISOString(),
      id: `client:${client.id}:created`,
      type: "client_created" as const,
    })),
    ...projects.map(({ clientName, project }) => ({
      clientId: project.clientId,
      clientName: clientName ?? "Unknown client",
      createdAt: project.createdAt.toISOString(),
      id: `project:${project.id}:created`,
      projectId: project.id,
      projectTitle: project.title,
      type: "project_created" as const,
    })),
    ...comments.map(({ authorName, note, projectTitle }) => ({
      authorId: note.userId,
      authorName: authorName ?? "Unknown user",
      contentPreview: truncateActivityContent(note.content),
      createdAt: note.createdAt.toISOString(),
      id: `comment:${note.id}`,
      projectId: note.projectId,
      projectTitle: projectTitle ?? "Unknown project",
      type: "comment_added" as const,
    })),
    ...files.map(({ file, projectTitle, uploaderName }) => ({
      authorId: file.uploadedBy,
      authorName: uploaderName ?? "Unknown user",
      createdAt: file.createdAt.toISOString(),
      fileId: file.id,
      fileName: file.fileName,
      id: `file:${file.id}`,
      projectId: file.projectId,
      projectTitle: projectTitle ?? "Unknown project",
      type: "file_uploaded" as const,
    })),
  ].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );
}

async function listProjectComments(projectId: string) {
  const rows = await db
    .select({
      authorName: usersTable.name,
      authorRole: usersTable.role,
      note: projectNotesTable,
    })
    .from(projectNotesTable)
    .leftJoin(usersTable, eq(projectNotesTable.userId, usersTable.id))
    .where(eq(projectNotesTable.projectId, projectId))
    .orderBy(desc(projectNotesTable.createdAt));

  return rows.map(({ authorName, authorRole, note }) =>
    mapProjectComment(note, authorName, authorRole)
  );
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

export async function listDashboardActivity(limit = 8) {
  const [clients, projects, comments, files] = await Promise.all([
    db
      .select()
      .from(clientsTable)
      .orderBy(desc(clientsTable.createdAt))
      .limit(limit),
    db
      .select({
        clientName: clientsTable.name,
        project: projectsTable,
      })
      .from(projectsTable)
      .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .orderBy(desc(projectsTable.createdAt))
      .limit(limit),
    db
      .select({
        authorName: usersTable.name,
        note: projectNotesTable,
        projectTitle: projectsTable.title,
      })
      .from(projectNotesTable)
      .leftJoin(usersTable, eq(projectNotesTable.userId, usersTable.id))
      .leftJoin(
        projectsTable,
        eq(projectNotesTable.projectId, projectsTable.id)
      )
      .orderBy(desc(projectNotesTable.createdAt))
      .limit(limit),
    db
      .select({
        file: filesTable,
        projectTitle: projectsTable.title,
        uploaderName: usersTable.name,
      })
      .from(filesTable)
      .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
      .leftJoin(projectsTable, eq(filesTable.projectId, projectsTable.id))
      .orderBy(desc(filesTable.createdAt))
      .limit(limit),
  ]);

  return buildDashboardActivityFeed({
    clients,
    comments,
    files,
    projects,
  }).slice(0, limit);
}

function mapPortalProject({
  client,
  project,
}: {
  client: typeof clientsTable.$inferSelect;
  project: typeof projectsTable.$inferSelect;
}): PortalProjectRecord {
  return {
    ...mapProject(project),
    clientCompany: client.company,
    clientName: client.name,
    clientSlug: getClientPathParam(mapClient(client)),
  };
}

async function listPortalProjectsForUser(user: SessionUser) {
  if (user.role === ROLES.ADMIN) {
    const rows = await db
      .select({
        client: clientsTable,
        project: projectsTable,
      })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .orderBy(desc(projectsTable.createdAt));

    return rows.map(mapPortalProject);
  }

  const rows = await db
    .select({
      client: clientsTable,
      project: projectsTable,
    })
    .from(clientUsersTable)
    .innerJoin(clientsTable, eq(clientUsersTable.clientId, clientsTable.id))
    .innerJoin(
      projectsTable,
      eq(projectsTable.clientId, clientUsersTable.clientId)
    )
    .where(eq(clientUsersTable.userId, user.id))
    .orderBy(desc(projectsTable.createdAt));

  return rows.map(mapPortalProject);
}

async function listPortalUpdates(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      authorName: usersTable.name,
      update: projectUpdatesTable,
    })
    .from(projectUpdatesTable)
    .leftJoin(usersTable, eq(projectUpdatesTable.authorId, usersTable.id))
    .where(inArray(projectUpdatesTable.projectId, projectIds))
    .orderBy(desc(projectUpdatesTable.createdAt));

  return rows.map(({ authorName, update }) =>
    mapProjectUpdate(update, authorName)
  );
}

async function listPortalMilestones(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(projectMilestonesTable)
    .where(inArray(projectMilestonesTable.projectId, projectIds))
    .orderBy(projectMilestonesTable.sortOrder, projectMilestonesTable.dueDate);

  return rows.map(mapProjectMilestone);
}

async function listPortalFiles(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      file: filesTable,
      uploaderName: usersTable.name,
    })
    .from(filesTable)
    .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
    .where(inArray(filesTable.projectId, projectIds))
    .orderBy(desc(filesTable.createdAt));

  return rows.map(({ file, uploaderName }) =>
    mapProjectFile(file, uploaderName)
  );
}

export async function getPortalSummary(user: SessionUser) {
  const projects = await listPortalProjectsForUser(user);
  const activeProjects = projects.filter(
    (project) => project.status !== "completed"
  );
  const projectIds = projects.map((project) => project.id);

  const [updates, milestones, files] = await Promise.all([
    listPortalUpdates(projectIds),
    listPortalMilestones(projectIds),
    listPortalFiles(projectIds),
  ]);

  const projectTitles = new Map(
    projects.map((project) => [project.id, project.title])
  );
  const latestUpdates = updates
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 5)
    .map((update) => ({
      ...serializeProjectUpdate(update),
      projectTitle: projectTitles.get(update.projectId) ?? "Project",
    }));
  const upcomingMilestones = milestones
    .filter((milestone) => milestone.status !== "done")
    .sort((left, right) => {
      const leftTime = left.dueDate
        ? Date.parse(left.dueDate)
        : Number.POSITIVE_INFINITY;
      const rightTime = right.dueDate
        ? Date.parse(right.dueDate)
        : Number.POSITIVE_INFINITY;

      return leftTime - rightTime || left.sortOrder - right.sortOrder;
    })
    .slice(0, 5)
    .map((milestone) => ({
      ...serializeProjectMilestone(milestone),
      projectTitle: projectTitles.get(milestone.projectId) ?? "Project",
    }));
  const recentFiles = files
    .map((file) => ({
      ...serializeProjectFile(file),
      projectTitle: projectTitles.get(file.projectId) ?? "Project",
    }))
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    )
    .slice(0, 5);

  return {
    activeProjects,
    latestUpdates,
    projectCount: projects.length,
    recentFiles,
    upcomingMilestones,
  };
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

export async function updateClientRecord(id: string, input: ClientInsert) {
  const updatedRows = await db
    .update(clientsTable)
    .set({
      company: input.company,
      email: input.email,
      name: input.name,
      notes: input.notes ?? "",
      phone: input.phone ?? "",
      status: input.status,
      tags: serializeTags(input.tags),
      website: input.website ?? "",
    })
    .where(eq(clientsTable.id, id))
    .returning();

  const updated = updatedRows[0];

  return updated ? mapClient(updated) : null;
}

export async function deleteClientRecord(id: string) {
  const deletedRows = await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, id))
    .returning({ id: clientsTable.id });

  return deletedRows.length > 0;
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

async function ensureProjectSlugIsAvailable({
  clientId,
  excludeProjectId,
  slug,
}: {
  clientId: string;
  excludeProjectId?: string;
  slug: string;
}) {
  const conditions = [
    eq(projectsTable.clientId, clientId),
    eq(projectsTable.slug, slug),
  ];

  if (excludeProjectId) {
    conditions.push(ne(projectsTable.id, excludeProjectId));
  }

  const duplicateRows = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(and(...conditions))
    .limit(1);

  if (duplicateRows.length > 0) {
    throw new DuplicateProjectSlugError();
  }
}

function isProjectSlugUniqueError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("projects_client_id_slug_unique");
}

export async function createProjectRecord(input: ProjectInsert) {
  const slug = getProjectSlug(input.title);

  await ensureProjectSlugIsAvailable({
    clientId: input.clientId,
    slug,
  });

  try {
    await db.insert(projectsTable).values({
      budget: input.budget,
      clientId: input.clientId,
      createdAt: new Date(),
      deadline: input.deadline ?? "",
      description: input.description ?? "",
      id: input.id,
      slug,
      status: input.status,
      title: input.title,
    });
  } catch (error) {
    if (isProjectSlugUniqueError(error)) {
      throw new DuplicateProjectSlugError();
    }

    throw error;
  }

  const [created] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, input.id))
    .limit(1);

  return created ? mapProject(created) : null;
}

export async function updateProjectRecord(id: string, input: ProjectInsert) {
  const [existing] = await db
    .select({
      clientId: projectsTable.clientId,
      slug: projectsTable.slug,
      title: projectsTable.title,
    })
    .from(projectsTable)
    .where(eq(projectsTable.id, id))
    .limit(1);

  if (!existing) {
    return null;
  }

  const slug =
    input.title === existing.title
      ? existing.slug
      : getProjectSlug(input.title);

  if (input.clientId !== existing.clientId || slug !== existing.slug) {
    await ensureProjectSlugIsAvailable({
      clientId: input.clientId,
      excludeProjectId: id,
      slug,
    });
  }

  let updatedRows: (typeof projectsTable.$inferSelect)[];

  try {
    updatedRows = await db
      .update(projectsTable)
      .set({
        budget: input.budget,
        clientId: input.clientId,
        deadline: input.deadline ?? "",
        description: input.description ?? "",
        slug,
        status: input.status,
        title: input.title,
      })
      .where(eq(projectsTable.id, id))
      .returning();
  } catch (error) {
    if (isProjectSlugUniqueError(error)) {
      throw new DuplicateProjectSlugError();
    }

    throw error;
  }

  const updated = updatedRows[0];

  return updated ? mapProject(updated) : null;
}

export async function deleteProjectRecord(id: string) {
  const deletedRows = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, id))
    .returning({ id: projectsTable.id });

  return deletedRows.length > 0;
}

export async function listProjectStorageKeys(projectId: string) {
  const rows = await db
    .select({ storageKey: filesTable.storageKey })
    .from(filesTable)
    .where(eq(filesTable.projectId, projectId));

  return rows.map((row) => row.storageKey);
}

export async function listClientStorageKeys(clientId: string) {
  const rows = await db
    .select({ storageKey: filesTable.storageKey })
    .from(filesTable)
    .innerJoin(projectsTable, eq(filesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.clientId, clientId));

  return rows.map((row) => row.storageKey);
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
    .select({
      authorName: usersTable.name,
      authorRole: usersTable.role,
      note: projectNotesTable,
    })
    .from(projectNotesTable)
    .leftJoin(usersTable, eq(projectNotesTable.userId, usersTable.id))
    .where(eq(projectNotesTable.id, input.id))
    .limit(1);

  return created
    ? mapProjectComment(created.note, created.authorName, created.authorRole)
    : null;
}

export async function listProjectUpdates(projectId: string) {
  const rows = await db
    .select({
      authorName: usersTable.name,
      update: projectUpdatesTable,
    })
    .from(projectUpdatesTable)
    .leftJoin(usersTable, eq(projectUpdatesTable.authorId, usersTable.id))
    .where(eq(projectUpdatesTable.projectId, projectId))
    .orderBy(desc(projectUpdatesTable.createdAt));

  return rows.map(({ authorName, update }) =>
    mapProjectUpdate(update, authorName)
  );
}

export async function listProjectUpdatesForUser(
  projectId: string,
  user: SessionUser
) {
  const hasAccess = await canAccessProject(user, projectId);

  if (!hasAccess) {
    return null;
  }

  return listProjectUpdates(projectId);
}

export async function createProjectUpdateRecord(input: ProjectUpdateInsert) {
  const now = new Date();

  await db.insert(projectUpdatesTable).values({
    authorId: input.authorId,
    body: input.body,
    createdAt: now,
    id: input.id,
    projectId: input.projectId,
    status: input.status,
    title: input.title,
    updatedAt: now,
  });

  const [created] = await db
    .select({
      authorName: usersTable.name,
      update: projectUpdatesTable,
    })
    .from(projectUpdatesTable)
    .leftJoin(usersTable, eq(projectUpdatesTable.authorId, usersTable.id))
    .where(eq(projectUpdatesTable.id, input.id))
    .limit(1);

  return created ? mapProjectUpdate(created.update, created.authorName) : null;
}

export async function updateProjectUpdateRecord(
  id: string,
  input: ProjectUpdatePatch
) {
  const updatedRows = await db
    .update(projectUpdatesTable)
    .set({
      body: input.body,
      status: input.status,
      title: input.title,
      updatedAt: new Date(),
    })
    .where(eq(projectUpdatesTable.id, id))
    .returning();

  const updated = updatedRows[0];

  if (!updated) {
    return null;
  }

  const [author] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, updated.authorId))
    .limit(1);

  return mapProjectUpdate(updated, author?.name ?? null);
}

export async function deleteProjectUpdateRecord(id: string) {
  const deletedRows = await db
    .delete(projectUpdatesTable)
    .where(eq(projectUpdatesTable.id, id))
    .returning({ id: projectUpdatesTable.id });

  return deletedRows.length > 0;
}

export async function listProjectMilestones(projectId: string) {
  const rows = await db
    .select()
    .from(projectMilestonesTable)
    .where(eq(projectMilestonesTable.projectId, projectId))
    .orderBy(projectMilestonesTable.sortOrder, projectMilestonesTable.dueDate);

  return rows.map(mapProjectMilestone);
}

export async function listProjectMilestonesForUser(
  projectId: string,
  user: SessionUser
) {
  const hasAccess = await canAccessProject(user, projectId);

  if (!hasAccess) {
    return null;
  }

  return listProjectMilestones(projectId);
}

export async function createProjectMilestoneRecord(
  input: ProjectMilestoneInsert
) {
  const now = new Date();

  await db.insert(projectMilestonesTable).values({
    createdAt: now,
    description: input.description ?? "",
    dueDate: input.dueDate ?? "",
    id: input.id,
    projectId: input.projectId,
    sortOrder: input.sortOrder,
    status: input.status,
    title: input.title,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(projectMilestonesTable)
    .where(eq(projectMilestonesTable.id, input.id))
    .limit(1);

  return created ? mapProjectMilestone(created) : null;
}

export async function updateProjectMilestoneRecord(
  id: string,
  input: ProjectMilestonePatch
) {
  const updatedRows = await db
    .update(projectMilestonesTable)
    .set({
      description: input.description ?? "",
      dueDate: input.dueDate ?? "",
      sortOrder: input.sortOrder,
      status: input.status,
      title: input.title,
      updatedAt: new Date(),
    })
    .where(eq(projectMilestonesTable.id, id))
    .returning();

  const updated = updatedRows[0];

  return updated ? mapProjectMilestone(updated) : null;
}

export async function deleteProjectMilestoneRecord(id: string) {
  const deletedRows = await db
    .delete(projectMilestonesTable)
    .where(eq(projectMilestonesTable.id, id))
    .returning({ id: projectMilestonesTable.id });

  return deletedRows.length > 0;
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

export async function getProjectById(projectId: string) {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  return project ?? null;
}

export async function getProjectNotificationContext(
  projectId: string
): Promise<ProjectNotificationContext | null> {
  const [projectRows, adminRows, clientRows] = await Promise.all([
    db
      .select({
        client: clientsTable,
        project: projectsTable,
      })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
      .where(eq(projectsTable.id, projectId))
      .limit(1),
    db
      .select({
        email: usersTable.email,
        id: usersTable.id,
        name: usersTable.name,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.role, ROLES.ADMIN)),
    db
      .select({
        email: usersTable.email,
        id: usersTable.id,
        name: usersTable.name,
        role: usersTable.role,
      })
      .from(clientUsersTable)
      .innerJoin(usersTable, eq(clientUsersTable.userId, usersTable.id))
      .innerJoin(
        projectsTable,
        eq(projectsTable.clientId, clientUsersTable.clientId)
      )
      .where(eq(projectsTable.id, projectId)),
  ]);
  const match = projectRows[0];

  if (!match) {
    return null;
  }

  const appUrl = process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "";
  const projectPath = `/projects/${getClientPathParam(mapClient(match.client))}/${match.project.slug || match.project.id}`;
  const uniqueRecipients = new Map(
    [...adminRows, ...clientRows].map((recipient) => [recipient.id, recipient])
  );

  return {
    clientCompany: match.client.company,
    clientName: match.client.name,
    discussionUrl: `${appUrl}${projectPath}#discussion`,
    projectId: match.project.id,
    projectTitle: match.project.title,
    projectUrl: `${appUrl}${projectPath}`,
    recipients: [...uniqueRecipients.values()].map(
      (recipient): NotificationRecipient => ({
        email: recipient.email,
        id: recipient.id,
        name: recipient.name,
        role: recipient.role,
      })
    ),
  };
}

export async function listProjectCommentsForUser(
  projectId: string,
  user: SessionUser
) {
  const hasAccess = await canAccessProject(user, projectId);

  if (!hasAccess) {
    return null;
  }

  return listProjectComments(projectId);
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

export async function getProjectCollaboration(projectId: string) {
  const [project, comments, files, updates] = await Promise.all([
    getProjectById(projectId),
    listProjectComments(projectId),
    db
      .select({
        file: filesTable,
        uploaderName: usersTable.name,
      })
      .from(filesTable)
      .leftJoin(usersTable, eq(filesTable.uploadedBy, usersTable.id))
      .where(eq(filesTable.projectId, projectId))
      .orderBy(desc(filesTable.createdAt)),
    listProjectUpdates(projectId),
  ]);

  if (!project) {
    return null;
  }

  const mappedFiles = files.map(({ file, uploaderName }) =>
    mapProjectFile(file, uploaderName)
  );

  return {
    activity: buildProjectActivityFeed({
      comments,
      files: mappedFiles,
      project,
      updates,
    }),
    comments: comments.map(serializeProjectComment),
  } satisfies PublicProjectCollaboration;
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
    revokedAt: null,
    token: input.token,
  });
}

export async function getClientById(clientId: string) {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);

  return client ? mapClient(client) : null;
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
        isNull(invitesTable.revokedAt),
        gt(invitesTable.expiresAt, new Date())
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
        isNull(invitesTable.revokedAt),
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

  const now = new Date();

  if (count === 0) {
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
        slug: "marketing-site-redesign",
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
        slug: "ios-client-portal",
        status: "planning",
        title: "iOS Client Portal",
      },
    ]);
  }

  await seedDemoDeliveryData(now);
}

async function seedDemoDeliveryData(now: Date) {
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const existingClients = new Set(
    (
      await db
        .select({ id: clientsTable.id })
        .from(clientsTable)
        .where(inArray(clientsTable.id, ["cli_1", "cli_2"]))
    ).map((client) => client.id)
  );
  const existingProjects = new Set(
    (
      await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(inArray(projectsTable.id, ["proj_1", "proj_2"]))
    ).map((project) => project.id)
  );

  if (existingClients.size === 0 && existingProjects.size === 0) {
    return;
  }

  await db
    .insert(usersTable)
    .values([
      {
        createdAt: daysAgo(18),
        email: "maya@clientra.test",
        emailVerified: true,
        id: "demo_admin",
        image: null,
        name: "Maya Rivera",
        role: "admin",
        updatedAt: daysAgo(1),
      },
      {
        createdAt: daysAgo(17),
        email: "jordan@acme.co",
        emailVerified: true,
        id: "demo_acme_client",
        image: null,
        name: "Jordan Lee",
        role: "client",
        updatedAt: daysAgo(1),
      },
      {
        createdAt: daysAgo(17),
        email: "avery@northstar.dev",
        emailVerified: true,
        id: "demo_northstar_client",
        image: null,
        name: "Avery Stone",
        role: "client",
        updatedAt: daysAgo(1),
      },
    ])
    .onConflictDoNothing();

  const existingUsers = new Set(
    (
      await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(
          inArray(usersTable.id, [
            "demo_admin",
            "demo_acme_client",
            "demo_northstar_client",
          ])
        )
    ).map((user) => user.id)
  );

  const clientLinks = [
    {
      clientId: "cli_1",
      id: "demo_link_acme",
      userId: "demo_acme_client",
    },
    {
      clientId: "cli_2",
      id: "demo_link_northstar",
      userId: "demo_northstar_client",
    },
  ].filter(
    (link) =>
      existingClients.has(link.clientId) && existingUsers.has(link.userId)
  );

  if (clientLinks.length > 0) {
    await db.insert(clientUsersTable).values(clientLinks).onConflictDoNothing();
  }

  const projectUpdates = (
    [
      {
        authorId: "demo_admin",
        body: "Homepage wireframes are approved and the component audit is complete. The next push is production-ready responsive templates.",
        createdAt: daysAgo(5),
        id: "demo_update_proj_1_wireframes",
        projectId: "proj_1",
        status: "on_track",
        title: "Wireframes approved",
        updatedAt: daysAgo(5),
      },
      {
        authorId: "demo_admin",
        body: "A few legacy pages need content cleanup before migration. Timeline is still workable if final copy lands this week.",
        createdAt: daysAgo(2),
        id: "demo_update_proj_1_content",
        projectId: "proj_1",
        status: "at_risk",
        title: "Content migration needs attention",
        updatedAt: daysAgo(2),
      },
      {
        authorId: "demo_admin",
        body: "Discovery interviews are booked and the portal information architecture is drafted for review.",
        createdAt: daysAgo(3),
        id: "demo_update_proj_2_discovery",
        projectId: "proj_2",
        status: "on_track",
        title: "Discovery underway",
        updatedAt: daysAgo(3),
      },
    ] satisfies (typeof projectUpdatesTable.$inferInsert)[]
  ).filter(
    (update) =>
      existingProjects.has(update.projectId) &&
      existingUsers.has(update.authorId)
  );

  if (projectUpdates.length > 0) {
    await db
      .insert(projectUpdatesTable)
      .values(projectUpdates)
      .onConflictDoNothing();
  }

  const projectMilestones = (
    [
      {
        createdAt: daysAgo(12),
        description:
          "Confirm site goals, analytics baselines, and priority content.",
        dueDate: "2026-03-25",
        id: "demo_milestone_proj_1_discovery",
        projectId: "proj_1",
        sortOrder: 1,
        status: "done",
        title: "Discovery complete",
        updatedAt: daysAgo(8),
      },
      {
        createdAt: daysAgo(10),
        description:
          "Approve homepage, product page, and content system direction.",
        dueDate: "2026-04-05",
        id: "demo_milestone_proj_1_design",
        projectId: "proj_1",
        sortOrder: 2,
        status: "in_progress",
        title: "Design approval",
        updatedAt: daysAgo(2),
      },
      {
        createdAt: daysAgo(8),
        description: "Ship page templates, redirect map, and launch checklist.",
        dueDate: "2026-04-10",
        id: "demo_milestone_proj_1_launch",
        projectId: "proj_1",
        sortOrder: 3,
        status: "todo",
        title: "Launch preparation",
        updatedAt: daysAgo(1),
      },
      {
        createdAt: daysAgo(7),
        description: "Map client-facing screens and notification expectations.",
        dueDate: "2026-05-02",
        id: "demo_milestone_proj_2_requirements",
        projectId: "proj_2",
        sortOrder: 1,
        status: "in_progress",
        title: "Requirements review",
        updatedAt: daysAgo(2),
      },
      {
        createdAt: daysAgo(7),
        description:
          "Prepare a clickable prototype for weekly status workflows.",
        dueDate: "2026-05-14",
        id: "demo_milestone_proj_2_prototype",
        projectId: "proj_2",
        sortOrder: 2,
        status: "todo",
        title: "Prototype handoff",
        updatedAt: daysAgo(2),
      },
    ] satisfies (typeof projectMilestonesTable.$inferInsert)[]
  ).filter((milestone) => existingProjects.has(milestone.projectId));

  if (projectMilestones.length > 0) {
    await db
      .insert(projectMilestonesTable)
      .values(projectMilestones)
      .onConflictDoNothing();
  }

  const projectNotes = [
    {
      content:
        "Please keep the launch checklist focused on redirects, SEO metadata, and final analytics QA.",
      createdAt: daysAgo(4),
      id: "demo_note_proj_1_client",
      projectId: "proj_1",
      userId: "demo_acme_client",
    },
    {
      content:
        "Added the redirect inventory and flagged pages that still need final copy.",
      createdAt: daysAgo(2),
      id: "demo_note_proj_1_admin",
      projectId: "proj_1",
      userId: "demo_admin",
    },
    {
      content:
        "Shared the first workflow map for review before prototype work starts.",
      createdAt: daysAgo(1),
      id: "demo_note_proj_2_admin",
      projectId: "proj_2",
      userId: "demo_admin",
    },
  ].filter(
    (note) =>
      existingProjects.has(note.projectId) && existingUsers.has(note.userId)
  );

  if (projectNotes.length > 0) {
    await db
      .insert(projectNotesTable)
      .values(projectNotes)
      .onConflictDoNothing();
  }

  const projectFiles = [
    {
      createdAt: daysAgo(6),
      fileName: "Acme content inventory.pdf",
      fileSize: 428_000,
      fileUrl: "https://example.com/clientra-demo/acme-content-inventory.pdf",
      id: "demo_file_proj_1_inventory",
      mimeType: "application/pdf",
      projectId: "proj_1",
      storageKey: "demo/acme-content-inventory.pdf",
      uploadedBy: "demo_admin",
    },
    {
      createdAt: daysAgo(2),
      fileName: "Portal workflow map.png",
      fileSize: 816_000,
      fileUrl: "https://example.com/clientra-demo/portal-workflow-map.png",
      id: "demo_file_proj_2_workflow",
      mimeType: "image/png",
      projectId: "proj_2",
      storageKey: "demo/portal-workflow-map.png",
      uploadedBy: "demo_admin",
    },
  ].filter(
    (file) =>
      existingProjects.has(file.projectId) && existingUsers.has(file.uploadedBy)
  );

  if (projectFiles.length > 0) {
    await db.insert(filesTable).values(projectFiles).onConflictDoNothing();
  }
}
