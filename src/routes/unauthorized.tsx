import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <p className="font-medium text-slate-400 text-sm uppercase tracking-[0.2em]">
          Clientra
        </p>
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
