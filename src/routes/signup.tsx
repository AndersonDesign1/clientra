import { createFileRoute } from "@tanstack/react-router";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { AdminSignupForm } from "@/components/auth/admin-signup-form";

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectAuthenticatedUser,
  component: SignupPage,
});

function SignupPage() {
  return <AdminSignupForm />;
}
