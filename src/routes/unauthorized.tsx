import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-stone-50 p-6 text-zinc-950">
      <div className="w-full max-w-md border-slate-200 border-y py-6 text-center">
        <p className="font-semibold text-lg tracking-tight">Clientra</p>
        <h1 className="mt-3 font-semibold text-2xl">Unauthorized</h1>
        <p className="mt-2 text-slate-600 text-sm">
          Your account does not currently have access to that area of the app.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            to="/login"
          >
            Return to login
          </Link>
          <Link className="text-sm underline" to="/">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
