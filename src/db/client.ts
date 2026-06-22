import { drizzle } from "drizzle-orm/libsql";
import { loadEnvFiles } from "./load-env";
import {
  accounts,
  clients,
  clientUsers,
  files,
  invites,
  projectMilestones,
  projectNotes,
  projects,
  projectUpdates,
  sessions,
  users,
  verifications,
} from "./schema";

loadEnvFiles();

const schema = {
  account: accounts,
  users,
  clients,
  clientUsers,
  session: sessions,
  invites,
  projects,
  projectMilestones,
  projectNotes,
  projectUpdates,
  files,
  verification: verifications,
};

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema,
});
