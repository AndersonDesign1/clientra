import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { loadEnvFiles } from "./load-env";
import {
  accounts,
  clients,
  clientUsers,
  files,
  invites,
  projectNotes,
  projects,
  sessions,
  users,
  verifications,
} from "./schema";

loadEnvFiles();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schema = {
  account: accounts,
  users,
  clients,
  clientUsers,
  session: sessions,
  invites,
  projects,
  projectNotes,
  files,
  verification: verifications,
};

export const db = drizzle(turso, { schema });
