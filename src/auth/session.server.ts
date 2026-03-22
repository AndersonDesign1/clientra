import "@tanstack/react-start/server-only";

import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "./better-auth";
import { ROLES, type Role, type SessionUser } from "./roles";

const VALID_ROLES = new Set<Role>(Object.values(ROLES));

function normalizeSessionUser(
  session: {
    user: {
      email: string;
      id: string;
      name: string;
      role?: string | null;
    };
  } | null
) {
  if (!(session?.user?.role && VALID_ROLES.has(session.user.role as Role))) {
    return null;
  }

  return {
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role as Role,
  } satisfies SessionUser;
}

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
