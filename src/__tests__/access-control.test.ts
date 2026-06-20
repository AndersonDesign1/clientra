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
      `clientra-access-control-${Date.now()}-${Math.random()
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

async function seedAccessControlScenario(
  client: ReturnType<typeof createClient>
) {
  const timestamp = 1_741_000_000_000;

  const users = [
    ["admin_1", "Admin User", "admin@example.com", ROLES.ADMIN],
    ["client_a", "Client A User", "clienta@example.com", ROLES.CLIENT],
    ["client_b", "Client B User", "clientb@example.com", ROLES.CLIENT],
  ] as const;

  for (const [id, name, email, role] of users) {
    await client.execute({
      args: [id, name, email, 1, null, role, timestamp, timestamp],
      sql: `insert into users
        (id, name, email, email_verified, image, role, created_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?)`,
    });
  }

  await client.execute({
    args: [
      "client_a_record",
      "Client A Contact",
      "Client A",
      "a@clienta.com",
      "",
      "",
      "active",
      "",
      "[]",
      timestamp,
    ],
    sql: `insert into clients
      (id, name, company, email, phone, website, status, notes, tags, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "client_b_record",
      "Client B Contact",
      "Client B",
      "b@clientb.com",
      "",
      "",
      "active",
      "",
      "[]",
      timestamp,
    ],
    sql: `insert into clients
      (id, name, company, email, phone, website, status, notes, tags, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: ["link_a", "client_a_record", "client_a"],
    sql: "insert into client_users (id, client_id, user_id) values (?, ?, ?)",
  });

  await client.execute({
    args: [
      "project_a",
      "client_a_record",
      "Client A Project",
      "client-a-project",
      "in_progress",
      10_000,
      "2026-04-10",
      "Project under Client A.",
      timestamp,
    ],
    sql: `insert into projects
      (id, client_id, title, slug, status, budget, deadline, description, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "file_a",
      "project_a",
      "client_a",
      "storage-key-a",
      "https://example.com/a.pdf",
      "a.pdf",
      1024,
      "application/pdf",
      timestamp,
    ],
    sql: `insert into files
      (id, project_id, uploaded_by, storage_key, file_url, file_name, file_size, mime_type, created_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });

  await client.execute({
    args: [
      "note_a",
      "project_a",
      "client_a",
      "Comment from linked client.",
      timestamp,
    ],
    sql: `insert into project_notes
      (id, project_id, user_id, content, created_at)
      values (?, ?, ?, ?, ?)`,
  });
}

describe("access control", () => {
  const clientsToClose: ReturnType<typeof createClient>[] = [];

  afterEach(async () => {
    while (clientsToClose.length > 0) {
      const client = clientsToClose.pop();

      if (client) {
        await client.close();
      }
    }
  });

  it("enforces project access for admins, linked clients, and outsiders", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedAccessControlScenario(client);

    const admin: SessionUser = {
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    };
    const clientA: SessionUser = {
      email: "clienta@example.com",
      id: "client_a",
      name: "Client A User",
      role: ROLES.CLIENT,
    };
    const clientB: SessionUser = {
      email: "clientb@example.com",
      id: "client_b",
      name: "Client B User",
      role: ROLES.CLIENT,
    };

    expect(await records.canAccessProject(admin, "project_a")).toBe(true);
    expect(await records.canAccessProject(clientA, "project_a")).toBe(true);
    expect(await records.canAccessProject(clientB, "project_a")).toBe(false);
    expect(await records.canAccessProject(clientA, "missing_project")).toBe(
      false
    );
  }, 15_000);

  it("returns null from list helpers when access is denied", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedAccessControlScenario(client);

    const clientA: SessionUser = {
      email: "clienta@example.com",
      id: "client_a",
      name: "Client A User",
      role: ROLES.CLIENT,
    };
    const clientB: SessionUser = {
      email: "clientb@example.com",
      id: "client_b",
      name: "Client B User",
      role: ROLES.CLIENT,
    };

    expect(
      await records.listProjectFilesForUser("project_a", clientB)
    ).toBeNull();
    expect(
      await records.listProjectCommentsForUser("project_a", clientB)
    ).toBeNull();

    const files = await records.listProjectFilesForUser("project_a", clientA);
    const comments = await records.listProjectCommentsForUser(
      "project_a",
      clientA
    );

    expect(files).not.toBeNull();
    expect(files?.length).toBeGreaterThan(0);
    expect(comments).not.toBeNull();
    expect(comments?.length).toBeGreaterThan(0);
  }, 15_000);
});
