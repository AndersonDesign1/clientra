import { createFileRoute } from "@tanstack/react-router";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/login")({
  beforeLoad: redirectAuthenticatedUser,
  component: LoginPage,
});

function LoginPage() {
  return <LoginForm />;
}
