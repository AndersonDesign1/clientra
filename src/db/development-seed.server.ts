import "@tanstack/react-start/server-only";

import { seedIfEmpty } from "./records";

function shouldSeedDevelopmentData() {
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  return !databaseUrl || databaseUrl.startsWith("file:");
}

const developmentSeedReady = shouldSeedDevelopmentData()
  ? seedIfEmpty().catch((error) => {
      console.error("development seed initialization failed", error);
      throw error;
    })
  : Promise.resolve();

export function ensureDevelopmentSeedData() {
  return developmentSeedReady;
}
