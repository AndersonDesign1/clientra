import type { SessionUser } from "./roles";
import { ROLES } from "./roles";

export const MOCK_ADMIN_USER: SessionUser = {
  id: "usr_admin_1",
  email: "admin@clientra.app",
  role: ROLES.ADMIN,
  name: "Clientra Admin",
};

export const MOCK_CLIENT_USER: SessionUser = {
  id: "usr_client_1",
  email: "client@acme.co",
  role: ROLES.CLIENT,
  name: "Acme Client",
};

export const getMockSessionUser = (asClient = false) =>
  asClient ? MOCK_CLIENT_USER : MOCK_ADMIN_USER;
