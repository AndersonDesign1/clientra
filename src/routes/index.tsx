import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROLES } from "@/auth/roles";
import { getSessionUser } from "@/auth/session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getSessionUser();
    let destination = "/login";

    if (user?.role === ROLES.CLIENT) {
      destination = "/portal";
    } else if (user?.role === ROLES.ADMIN) {
      destination = "/dashboard";
    } else if (user) {
      destination = "/unauthorized";
    }

    throw redirect({
      to: destination,
    });
  },
  component: () => null,
});
