import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="font-semibold text-3xl">Create account</h1>
      <input className="rounded-md border p-2" placeholder="Name" />
      <input className="rounded-md border p-2" placeholder="Email" />
      <input
        className="rounded-md border p-2"
        placeholder="Password"
        type="password"
      />
      <Button>Create account</Button>
      <p className="text-slate-600 text-sm">
        Already have one?{" "}
        <Link className="underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
