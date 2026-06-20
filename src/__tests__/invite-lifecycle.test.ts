import { readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

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
      `clientra-invite-lifecycle-${Date.now()}-${Math.random()
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

async function seedInviteClient(client: ReturnType<typeof createClient>) {
  const timestamp = 1_741_000_000_000;

  await client.execute({
    args: [
      "invite_client",
      "Invite Client",
      "Invite Co",
      "invite@example.com",
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
      "redeem_user",
      "Redeem User",
      "redeem@example.com",
      1,
      null,
      ROLES.ADMIN,
      timestamp,
      timestamp,
    ],
    sql: `insert into users
      (id, name, email, email_verified, image, role, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?)`,
  });
}

async function insertInvite(
  client: ReturnType<typeof createClient>,
  input: {
    consumedAt?: number | null;
    expiresAt: number;
    id: string;
    revokedAt?: number | null;
    token: string;
  }
) {
  const createdAt = 1_741_000_000_000;

  await client.execute({
    args: [
      input.id,
      "invite_client",
      "redeem@example.com",
      input.token,
      input.expiresAt,
      input.consumedAt ?? null,
      input.revokedAt ?? null,
      createdAt,
      null,
      null,
    ],
    sql: `insert into invites
      (id, client_id, email, token, expires_at, consumed_at, revoked_at, created_at, initiated_by_client_id, admin_approved_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  });
}

describe("invite lifecycle", () => {
  const clientsToClose: ReturnType<typeof createClient>[] = [];

  afterEach(async () => {
    while (clientsToClose.length > 0) {
      const client = clientsToClose.pop();

      if (client) {
        await client.close();
      }
    }
  });

  it("returns active invites only when token is valid and unused", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedInviteClient(client);

    const future = 4_102_444_800_000;
    const past = 1_000_000;
    const now = 1_741_000_000_000;

    await insertInvite(client, {
      id: "invite_fresh",
      token: "token-fresh",
      expiresAt: future,
    });
    await insertInvite(client, {
      id: "invite_expired",
      token: "token-expired",
      expiresAt: past,
    });
    await insertInvite(client, {
      id: "invite_revoked",
      token: "token-revoked",
      expiresAt: future,
      revokedAt: now,
    });
    await insertInvite(client, {
      id: "invite_consumed",
      token: "token-consumed",
      expiresAt: future,
      consumedAt: now,
    });

    expect(await records.getActiveInviteByToken("token-fresh")).not.toBeNull();
    expect(await records.getActiveInviteByToken("token-expired")).toBeNull();
    expect(await records.getActiveInviteByToken("token-revoked")).toBeNull();
    expect(await records.getActiveInviteByToken("token-consumed")).toBeNull();
  }, 15_000);

  it("consumes invites exactly once", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedInviteClient(client);

    const token = "token-single-use";

    await insertInvite(client, {
      id: "invite_single",
      token,
      expiresAt: 4_102_444_800_000,
    });

    expect(await records.consumeInvite(token)).toBe(true);
    expect(await records.consumeInvite(token)).toBe(false);
    expect(await records.getActiveInviteByToken(token)).toBeNull();
  }, 15_000);

  it("updates user role and links users to clients idempotently", async () => {
    const { client, records } = await createRecordsTestContext();
    clientsToClose.push(client);
    await seedInviteClient(client);

    await records.updateUserRole("redeem_user", ROLES.CLIENT);

    const roleRows = await client.execute(
      "select role from users where id = 'redeem_user'"
    );
    expect(roleRows.rows[0]?.role).toBe(ROLES.CLIENT);

    await records.linkUserToClient("invite_client", "redeem_user");
    await records.linkUserToClient("invite_client", "redeem_user");

    const linkRows = await client.execute(
      "select count(*) as count from client_users where client_id = 'invite_client' and user_id = 'redeem_user'"
    );
    expect(linkRows.rows[0]?.count).toBe(1);
  }, 15_000);
});
