import { Link } from "@tanstack/react-router";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
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
    <SidebarProvider className="bg-stone-50 text-zinc-950">
      <Sidebar className="bg-stone-100/70">
        <SidebarHeader>
          <p className="font-semibold text-lg tracking-tight">Clientra</p>
          <p className="text-muted-foreground text-xs">{workspaceLabel}</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link className="block" to={item.href}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        active={isActive}
                        className="rounded-md"
                      >
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="border-slate-200 border-t pt-3 text-sm">
            <p className="font-medium">{user?.name ?? "Loading account"}</p>
            <p className="truncate text-muted-foreground text-xs">
              {user?.email ?? "Checking session..."}
            </p>
          </div>
          <SignOutButton className="w-full" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-stone-50">
        <header className="border-b bg-stone-100/80 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold tracking-tight">Clientra</p>
            <SignOutButton />
          </div>
          <nav className="mt-3 flex flex-wrap gap-2">
            {adminNav.map((item) => (
              <Link
                activeProps={{
                  className: "border-slate-900 bg-white text-zinc-950",
                }}
                className="rounded-md border border-transparent px-2 py-1 text-sm"
                key={item.href}
                to={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
