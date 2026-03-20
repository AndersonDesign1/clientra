import "@tanstack/react-start/server-only";

import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invites, users } from "@/db/schema";
import { auth } from "./better-auth";
import type { SessionUser } from "./roles";

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
  if (!session?.user?.role) {
    return null;
  }

  return {
    email: session.user.email,
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  } as SessionUser;
}

export async function getSessionUserFromHeaders(headers?: HeadersInit) {
  const session = await auth.api.getSession({
    headers: headers ?? getRequestHeaders(),
  });

  return normalizeSessionUser(session);
}

export async function getInviteByToken(token: string) {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  return invite ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}
