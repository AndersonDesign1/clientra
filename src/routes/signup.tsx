import { createFileRoute } from "@tanstack/react-router";
import { getAdminSignupAvailability } from "@/auth/bootstrap";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { AdminSignupForm } from "@/components/auth/admin-signup-form";

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectAuthenticatedUser,
  loader: () => getAdminSignupAvailability(),
  component: SignupPage,
});

function SignupPage() {
  const { isOpen } = Route.useLoaderData();

  return <AdminSignupForm isBootstrapOpen={isOpen} />;
}
