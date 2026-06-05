export const ROLES = {
  ADMIN: "admin",
  CLIENT: "client",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface SessionUser {
  activeOrganizationId?: string | null;
  email: string;
  id: string;
  name: string;
  role: Role;
}
