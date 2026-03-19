import { Link } from "@tanstack/react-router";

const adminNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[220px_1fr]">
        <aside className="border-slate-200 border-r bg-white p-5">
          <p className="mb-6 font-semibold text-lg">Clientra</p>
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
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
