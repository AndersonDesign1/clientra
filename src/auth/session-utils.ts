import { ROLES, type Role, type SessionUser } from "./roles";

const VALID_ROLES = new Set<Role>(Object.values(ROLES));

export function normalizeSessionUser(
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
