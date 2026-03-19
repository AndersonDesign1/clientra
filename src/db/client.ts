import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { loadEnvFiles } from "./load-env";
import {
  clients,
  clientUsers,
  files,
  projectNotes,
  projects,
  users,
} from "./schema";

loadEnvFiles();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schema = {
  users,
  clients,
  clientUsers,
  projects,
  projectNotes,
  files,
};

export const db = drizzle(turso, { schema });
