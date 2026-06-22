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

  if (!user.activeOrganizationId) {
    throw redirect({ to: "/onboarding" });
  }

  return user;
}

export async function requireOnboardingSession() {
  const user = await getSessionUser();

  if (!user) {
    throw redirect({ to: "/login" });
  }

  if (user.role !== ROLES.ADMIN) {
    throw redirect({ to: "/portal" });
  }

  if (user.activeOrganizationId) {
    throw redirect({ to: "/dashboard" });
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

  const adminDestination = user.activeOrganizationId
    ? "/dashboard"
    : "/onboarding";

  throw redirect({
    to: user.role === ROLES.ADMIN ? adminDestination : "/portal",
  });
}
