import { readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
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
  // biome-ignore lint/performance/noDelete: the libSQL client treats a literal "undefined" token differently from an absent token.
  delete process.env.TURSO_AUTH_TOKEN;

  const client = await applyMigrations(databaseUrl);
  const records = await import("@/db/records");

  return { client, records };
}

async function seedCollaborationScenario(
  client: ReturnType<typeof createClient>
) {
  const timestamps = {
    file: 1_741_000_300_000,
    milestone: 1_741_000_360_000,
    noteFromClient: 1_741_000_200_000,
    noteFromAdmin: 1_741_000_100_000,
    project: 1_741_000_000_000,
    update: 1_741_000_350_000,
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
    sql: "insert into client_users (id, client_id, user_id) values (?, ?, ?)",
  });

  await client.execute({
    args: [
      "project_1",
      "client_1",
      "Client Portal Refresh",
      "in_progress",
      15_000,
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

  await client.execute({
    args: [
      "update_1",
      "project_1",
      "admin_1",
      "Weekly status",
      "The build is on track for the next review.",
      "on_track",
      timestamps.update,
      timestamps.update,
    ],
    sql: `insert into project_updates
      (id, project_id, author_id, title, body, status, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "milestone_1",
      "project_1",
      "Design approval",
      "Approve the final design direction.",
      "in_progress",
      "2026-04-12",
      1,
      timestamps.milestone,
      timestamps.milestone,
    ],
    sql: `insert into project_milestones
      (id, project_id, title, description, status, due_date, sort_order, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });
}

describe("records collaboration helpers", () => {
  const clientsToClose: ReturnType<typeof createClient>[] = [];

  afterEach(async () => {
    while (clientsToClose.length > 0) {
      const client = clientsToClose.pop();

      if (client) {
        await client.close();
      }
    }
  });

  it("keeps a migrated deduped project slug when the title is unchanged", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);

    await client.execute({
      args: [
        "client_1",
        "Jordan Lee",
        "Acme Inc.",
        "jordan@acme.co",
        "",
        "",
        "active",
        "",
        "[]",
        1_741_000_000_000,
      ],
      sql: `insert into clients
        (id, name, company, email, phone, website, status, notes, tags, created_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    });

    await client.batch([
      {
        args: [
          "project_1",
          "client_1",
          "Same Name",
          "same-name",
          "planning",
          1000,
          "",
          "",
          1_741_000_000_001,
        ],
        sql: `insert into projects
          (id, client_id, title, slug, status, budget, deadline, description, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
      {
        args: [
          "project_2",
          "client_1",
          "Same Name",
          "same-name-2",
          "planning",
          2000,
          "",
          "",
          1_741_000_000_002,
        ],
        sql: `insert into projects
          (id, client_id, title, slug, status, budget, deadline, description, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
    ]);

    const updated = await records.updateProjectRecord("project_2", {
      budget: 2500,
      clientId: "client_1",
      deadline: "",
      description: "Updated without renaming.",
      id: "project_2",
      status: "in_progress",
      title: "Same Name",
    });

    expect(updated?.slug).toBe("same-name-2");
    expect(updated?.budget).toBe(2500);
  }, 10_000);

  it("lists project comments with author metadata and enforces access", async () => {
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
  }, 15_000);

  it("builds a unified activity feed in reverse chronological order", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedCollaborationScenario(client);

    const collaboration = await records.getProjectCollaboration("project_1");

    expect(collaboration?.activity.map((event) => event.type)).toEqual([
      "project_update",
      "file_uploaded",
      "note_added",
      "note_added",
      "project_created",
    ]);
    expect(collaboration?.activity[0]).toMatchObject({
      title: "Weekly status",
      type: "project_update",
    });
    expect(collaboration?.activity[1]).toMatchObject({
      fileName: "brief.pdf",
      type: "file_uploaded",
    });
    expect(collaboration?.activity[2]).toMatchObject({
      authorName: "Client User",
      type: "note_added",
    });
  }, 15_000);

  it("builds admin dashboard activity from clients, projects, comments, and files", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedCollaborationScenario(client);

    const longComment = `${"A detailed implementation note ".repeat(8)}done.`;

    await client.execute({
      args: ["note_3", "project_1", "admin_1", longComment, 1_741_000_400_000],
      sql: `insert into project_notes
        (id, project_id, user_id, content, created_at)
        values (?, ?, ?, ?, ?)`,
    });

    const activity = await records.listDashboardActivity();

    expect(activity.map((event) => event.type)).toEqual([
      "comment_added",
      "file_uploaded",
      "comment_added",
      "comment_added",
      "client_created",
      "project_created",
    ]);
    const firstEvent = activity[0];

    expect(firstEvent).toMatchObject({
      authorName: "Admin User",
      projectTitle: "Client Portal Refresh",
      type: "comment_added",
    });
    expect(firstEvent.type).toBe("comment_added");
    if (firstEvent.type !== "comment_added") {
      throw new Error("Expected the newest dashboard event to be a comment.");
    }
    expect(firstEvent.contentPreview).toHaveLength(140);
    expect(firstEvent.contentPreview.endsWith("...")).toBe(true);
    expect(activity).toContainEqual(
      expect.objectContaining({
        clientName: "Jordan Lee",
        company: "Acme Inc.",
        type: "client_created",
      })
    );
    expect(activity).toContainEqual(
      expect.objectContaining({
        clientName: "Jordan Lee",
        projectTitle: "Client Portal Refresh",
        type: "project_created",
      })
    );
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

  it("lists project milestones for linked users in display order", async () => {
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

    const milestones = await records.listProjectMilestonesForUser(
      "project_1",
      linkedClient
    );

    expect(milestones?.[0]).toMatchObject({
      dueDate: "2026-04-12",
      status: "in_progress",
      title: "Design approval",
    });

    expect(
      await records.listProjectMilestonesForUser("project_1", outsideClient)
    ).toBeNull();
  });

  it("enriches existing demo clients with delivery data", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);

    const createdAt = 1_741_000_000_000;

    await client.batch([
      {
        args: [
          "cli_1",
          "Jordan Lee",
          "Acme Inc.",
          "jordan@acme.co",
          "",
          "",
          "active",
          "",
          "[]",
          createdAt,
        ],
        sql: `insert into clients
          (id, name, company, email, phone, website, status, notes, tags, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
      {
        args: [
          "cli_2",
          "Avery Stone",
          "Northstar Labs",
          "avery@northstar.dev",
          "",
          "",
          "active",
          "",
          "[]",
          createdAt,
        ],
        sql: `insert into clients
          (id, name, company, email, phone, website, status, notes, tags, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
      {
        args: [
          "proj_1",
          "cli_1",
          "Marketing Site Redesign",
          "marketing-site-redesign",
          "in_progress",
          12_000,
          "2026-04-10",
          "Modernize IA, design system, and page templates.",
          createdAt,
        ],
        sql: `insert into projects
          (id, client_id, title, slug, status, budget, deadline, description, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
      {
        args: [
          "proj_2",
          "cli_2",
          "iOS Client Portal",
          "ios-client-portal",
          "planning",
          18_000,
          "2026-05-20",
          "Client-facing project status and messaging app.",
          createdAt,
        ],
        sql: `insert into projects
          (id, client_id, title, slug, status, budget, deadline, description, created_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      },
    ]);

    await records.seedIfEmpty();
    await records.seedIfEmpty();

    expect(await records.listProjectUpdates("proj_1")).toHaveLength(2);
    expect(await records.listProjectMilestones("proj_1")).toHaveLength(3);
    expect(
      (await records.getProjectCollaboration("proj_1"))?.comments
    ).toHaveLength(2);
  }, 15_000);
});
