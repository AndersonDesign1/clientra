import { createFileRoute } from "@tanstack/react-router";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { SignupForm } from "@/components/auth/signup-form";

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectAuthenticatedUser,
  component: SignupPage,
});

function SignupPage() {
  return <SignupForm />;
}
