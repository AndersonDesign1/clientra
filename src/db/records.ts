import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "./client";
import {
  clients as clientsTable,
  projectNotes as projectNotesTable,
  projects as projectsTable,
  users as usersTable,
} from "./schema";

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

let hasSeededRecords = false;

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

export async function searchRecords(query: string) {
  const normalized = `%${escapeLikePattern(query.toLowerCase())}%`;

  const [matchedClients, matchedProjects] = await Promise.all([
    db
      .select()
      .from(clientsTable)
      .where(
        or(
          sql`lower(${clientsTable.name}) like ${normalized} escape '\\'`,
          sql`lower(${clientsTable.company}) like ${normalized} escape '\\'`
        )
      )
      .orderBy(desc(clientsTable.createdAt)),
    db
      .select()
      .from(projectsTable)
      .where(sql`lower(${projectsTable.title}) like ${normalized} escape '\\'`)
      .orderBy(desc(projectsTable.createdAt)),
  ]);

  return {
    clients: matchedClients.map(mapClient),
    projects: matchedProjects.map(mapProject),
  };
}

export async function seedIfEmpty() {
  if (hasSeededRecords) {
    return;
  }

  const now = new Date();

  await db
    .insert(usersTable)
    .values([
      {
        createdAt: now,
        email: "admin@clientra.app",
        emailVerified: true,
        id: "usr_admin_1",
        image: null,
        name: "Clientra Admin",
        role: "admin",
        updatedAt: now,
      },
      {
        createdAt: now,
        email: "client@acme.co",
        emailVerified: true,
        id: "usr_client_1",
        image: null,
        name: "Acme Client",
        role: "client",
        updatedAt: now,
      },
    ])
    .onConflictDoNothing();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clientsTable);

  if (count > 0) {
    hasSeededRecords = true;
    return;
  }

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

  hasSeededRecords = true;
}
