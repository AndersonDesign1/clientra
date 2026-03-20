"use client";

import { Link } from "@tanstack/react-router";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth-client";

const portalNav = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/projects", label: "Projects" },
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-slate-200 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-lg">Clientra Portal</p>
            <p className="text-slate-500 text-sm">
              {user?.name
                ? `Signed in as ${user.name}`
                : "Secure client access"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2 rounded-full border bg-slate-50 p-1">
              {portalNav.map((item) => (
                <Link
                  activeOptions={
                    item.href === "/portal" ? { exact: true } : undefined
                  }
                  activeProps={{
                    className: "bg-slate-900 text-white hover:bg-slate-900",
                  }}
                  className="rounded-full px-3 py-2 text-slate-600 text-sm hover:bg-white"
                  key={item.href}
                  to={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
