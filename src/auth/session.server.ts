import "@tanstack/react-start/server-only";

import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "./better-auth";
import { normalizeSessionUser } from "./session-utils";

export async function getSessionUserFromHeaders(headers?: HeadersInit) {
  const session = await auth.api.getSession({
    headers: headers ?? getRequestHeaders(),
  });

  return normalizeSessionUser(session);
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}
