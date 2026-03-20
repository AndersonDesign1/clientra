import { Link } from "@tanstack/react-router";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth-client";

const adminNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const user = session.data?.user as
    | { email?: string; name?: string; role?: string }
    | undefined;
  const workspaceLabel = user?.name
    ? [user.name, user.role].filter(Boolean).join(" · ")
    : "Admin workspace";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col border-slate-200 border-r bg-white p-5">
          <div>
            <p className="mb-1 font-semibold text-lg">Clientra</p>
            <p className="mb-6 text-slate-500 text-sm">{workspaceLabel}</p>
          </div>
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <Link
                activeProps={{
                  className: "bg-slate-900 text-white hover:bg-slate-900",
                }}
                className="block rounded-md px-3 py-2 text-slate-700 text-sm hover:bg-slate-100"
                key={item.href}
                to={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 rounded-xl border bg-slate-50 p-3">
            <div className="text-sm">
              <p className="font-medium text-slate-900">
                {user?.name ?? "Loading account"}
              </p>
              <p className="text-slate-500 text-xs">
                {user?.email ?? "Checking session..."}
              </p>
            </div>
            <SignOutButton className="w-full" />
          </div>
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
