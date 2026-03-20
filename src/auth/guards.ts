import { redirect } from "@tanstack/react-router";
import type { Role } from "./roles";
import { ROLES } from "./roles";
import { getSessionUser } from "./session";

export function requireRole(role: Role, userRole: Role | null) {
  if (!userRole || userRole !== role) {
    throw redirect({
      to: (role === ROLES.ADMIN ? "/login" : "/portal") as never,
    });
  }
}

export async function requireAdminSession() {
  const user = await getSessionUser();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  if (user.role !== ROLES.ADMIN) {
    throw redirect({ to: "/portal" });
  }

  return user;
}

export async function requireClientSession() {
  const user = await getSessionUser();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  if (user.role !== ROLES.CLIENT) {
    throw redirect({ to: "/dashboard" });
  }

  return user;
}

export async function redirectAuthenticatedUser() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  throw redirect({
    to: user.role === ROLES.ADMIN ? "/dashboard" : "/portal",
  });
}
