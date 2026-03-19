import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="font-semibold text-3xl">Sign in to Clientra</h1>
      <input className="rounded-md border p-2" placeholder="Email" />
      <input
        className="rounded-md border p-2"
        placeholder="Password"
        type="password"
      />
      <Button>Sign in</Button>
      <p className="text-slate-600 text-sm">
        No account?{" "}
        <Link className="underline" to="/signup">
          Create one
        </Link>
      </p>
    </div>
  );
}
