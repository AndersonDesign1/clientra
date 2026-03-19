import { redirect } from "@tanstack/react-router";
import type { Role } from "./roles";
import { ROLES } from "./roles";

export function requireRole(role: Role, userRole: Role | null) {
  if (!userRole || userRole !== role) {
    throw redirect({
      to: (role === ROLES.ADMIN ? "/login" : "/portal") as never,
    });
  }
}
