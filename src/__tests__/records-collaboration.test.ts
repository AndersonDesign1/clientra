import { createClient } from "@libsql/client";
import os from "node:os";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROLES, type SessionUser } from "@/auth/roles";

async function applyMigrations(url: string) {
  const client = createClient({ url });
  const migrationDirectory = path.resolve(process.cwd(), "drizzle");
  const fileNames = (await readdir(migrationDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of fileNames) {
    const sql = await readFile(path.join(migrationDirectory, fileName), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.execute(statement);
    }
  }

  return client;
}

async function createRecordsTestContext() {
  vi.resetModules();

  const databasePath = path
    .join(
      os.tmpdir(),
      `clientra-collaboration-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.db`
    )
    .replaceAll("\\", "/");
  const databaseUrl = `file:${databasePath}`;

  process.env.TURSO_DATABASE_URL = databaseUrl;
  delete process.env.TURSO_AUTH_TOKEN;

  const client = await applyMigrations(databaseUrl);
  const records = await import("@/db/records");

  return { client, records };
}

async function seedCollaborationScenario(client: ReturnType<typeof createClient>) {
  const timestamps = {
    file: 1_741_000_300_000,
    noteFromClient: 1_741_000_200_000,
    noteFromAdmin: 1_741_000_100_000,
    project: 1_741_000_000_000,
    user: 1_740_999_900_000,
  } as const;

  await client.execute({
    args: [
      "admin_1",
      "Admin User",
      "admin@example.com",
      1,
      null,
      ROLES.ADMIN,
      timestamps.user,
      timestamps.user,
    ],
    sql: `insert into users
      (id, name, email, email_verified, image, role, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "client_user_1",
      "Client User",
      "client@example.com",
      1,
      null,
      ROLES.CLIENT,
      timestamps.user,
      timestamps.user,
    ],
    sql: `insert into users
      (id, name, email, email_verified, image, role, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "client_user_2",
      "Outside User",
      "outside@example.com",
      1,
      null,
      ROLES.CLIENT,
      timestamps.user,
      timestamps.user,
    ],
    sql: `insert into users
      (id, name, email, email_verified, image, role, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "client_1",
      "Jordan Lee",
      "Acme Inc.",
      "jordan@acme.co",
      "",
      "",
      "active",
      "Primary stakeholder",
      "[]",
      timestamps.project,
    ],
    sql: `insert into clients
      (id, name, company, email, phone, website, status, notes, tags, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: ["link_1", "client_1", "client_user_1"],
    sql: `insert into client_users (id, client_id, user_id) values (?, ?, ?)`,
  });

  await client.execute({
    args: [
      "project_1",
      "client_1",
      "Client Portal Refresh",
      "in_progress",
      15000,
      "2026-04-10",
      "Upgrade the client collaboration experience.",
      timestamps.project,
    ],
    sql: `insert into projects
      (id, client_id, title, status, budget, deadline, description, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "note_1",
      "project_1",
      "admin_1",
      "Kickoff notes from the admin side.",
      timestamps.noteFromAdmin,
    ],
    sql: `insert into project_notes
      (id, project_id, user_id, content, created_at)
      values (?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "note_2",
      "project_1",
      "client_user_1",
      "Client feedback with more detail for the next review.",
      timestamps.noteFromClient,
    ],
    sql: `insert into project_notes
      (id, project_id, user_id, content, created_at)
      values (?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "file_1",
      "project_1",
      "client_user_1",
      "storage-key-1",
      "https://example.com/brief.pdf",
      "brief.pdf",
      2048,
      "application/pdf",
      timestamps.file,
    ],
    sql: `insert into files
      (id, project_id, uploaded_by, storage_key, file_url, file_name, file_size, mime_type, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });
}

describe("records collaboration helpers", () => {
  const clientsToClose: Array<ReturnType<typeof createClient>> = [];

  afterEach(async () => {
    while (clientsToClose.length > 0) {
      const client = clientsToClose.pop();

      if (client) {
        await client.close();
      }
    }
  });

  it(
    "lists project comments with author metadata and enforces access",
    async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedCollaborationScenario(client);

    const linkedClient: SessionUser = {
      email: "client@example.com",
      id: "client_user_1",
      name: "Client User",
      role: ROLES.CLIENT,
    };
    const outsideClient: SessionUser = {
      email: "outside@example.com",
      id: "client_user_2",
      name: "Outside User",
      role: ROLES.CLIENT,
    };

    const visibleComments = await records.listProjectCommentsForUser(
      "project_1",
      linkedClient
    );

    expect(visibleComments?.map((comment) => comment.authorName)).toEqual([
      "Client User",
      "Admin User",
    ]);
    expect(visibleComments?.[0]?.authorRole).toBe(ROLES.CLIENT);
    expect(visibleComments?.[0]?.projectId).toBe("project_1");

    const blockedComments = await records.listProjectCommentsForUser(
      "project_1",
      outsideClient
    );

    expect(blockedComments).toBeNull();
    },
    15_000
  );

  it("builds a unified activity feed in reverse chronological order", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedCollaborationScenario(client);

    const collaboration = await records.getProjectCollaboration("project_1");

    expect(collaboration?.activity.map((event) => event.type)).toEqual([
      "file_uploaded",
      "note_added",
      "note_added",
      "project_created",
    ]);
    expect(collaboration?.activity[0]).toMatchObject({
      fileName: "brief.pdf",
      type: "file_uploaded",
    });
    expect(collaboration?.activity[1]).toMatchObject({
      authorName: "Client User",
      type: "note_added",
    });
  });

  it("keeps project access checks working for admin, linked client, and outsider", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedCollaborationScenario(client);

    const admin: SessionUser = {
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    };
    const linkedClient: SessionUser = {
      email: "client@example.com",
      id: "client_user_1",
      name: "Client User",
      role: ROLES.CLIENT,
    };
    const outsideClient: SessionUser = {
      email: "outside@example.com",
      id: "client_user_2",
      name: "Outside User",
      role: ROLES.CLIENT,
    };

    expect(await records.canAccessProject(admin, "project_1")).toBe(true);
    expect(await records.canAccessProject(linkedClient, "project_1")).toBe(
      true
    );
    expect(await records.canAccessProject(outsideClient, "project_1")).toBe(
      false
    );
  });
});
