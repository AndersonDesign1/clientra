import { sql } from "drizzle-orm";
import { db } from "../src/db/client.ts";

// Add new columns to invites table (ignore if already exist)
for (const [col, ddl] of [
  ["initiated_by_client_id", "ALTER TABLE invites ADD COLUMN initiated_by_client_id TEXT REFERENCES clients(id)"],
  ["admin_approved_at", "ALTER TABLE invites ADD COLUMN admin_approved_at INTEGER"],
] as const) {
  try {
    await db.run(sql.raw(ddl));
    console.log(`✓ Added column: ${col}`);
  } catch (e: unknown) {
    console.log(`- Column ${col} already exists or error:`, (e as Error).message);
  }
}

// Create status_change_requests table
try {
  await db.run(sql.raw(`
    CREATE TABLE IF NOT EXISTS status_change_requests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      requested_status TEXT NOT NULL,
      reason TEXT NOT NULL,
      approval_state TEXT NOT NULL DEFAULT 'pending',
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `));
  console.log("✓ Created status_change_requests table");
} catch (e: unknown) {
  console.log("status_change_requests error:", (e as Error).message);
}

console.log("Migration complete ✓");
process.exit(0);
