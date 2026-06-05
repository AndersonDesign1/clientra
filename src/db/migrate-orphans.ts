import { isNull } from "drizzle-orm";
import { db } from "./client";
import { clients, clientUsers } from "./schema";

async function run() {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error(
      "Error: Please provide the target organization ID as an argument."
    );
    console.error("Usage: bun run src/db/migrate-orphans.ts <org-id>");
    process.exit(1);
  }

  console.log(`Migrating orphaned records to organization: ${orgId}...`);

  // Find orphan clients
  const orphanClients = await db
    .select()
    .from(clients)
    .where(isNull(clients.organizationId));
  console.log(`Found ${orphanClients.length} clients without an organization.`);

  // Find orphan clientUsers
  const orphanClientUsers = await db
    .select()
    .from(clientUsers)
    .where(isNull(clientUsers.organizationId));
  console.log(
    `Found ${orphanClientUsers.length} client-user assignments without an organization.`
  );

  if (orphanClients.length === 0 && orphanClientUsers.length === 0) {
    console.log("No orphaned records to migrate.");
    process.exit(0);
  }

  // Perform migration updates
  if (orphanClients.length > 0) {
    await db
      .update(clients)
      .set({ organizationId: orgId })
      .where(isNull(clients.organizationId));
    console.log(`Successfully migrated ${orphanClients.length} clients.`);
  }

  if (orphanClientUsers.length > 0) {
    await db
      .update(clientUsers)
      .set({ organizationId: orgId })
      .where(isNull(clientUsers.organizationId));
    console.log(
      `Successfully migrated ${orphanClientUsers.length} client-user assignments.`
    );
  }

  console.log("Migration complete!");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
