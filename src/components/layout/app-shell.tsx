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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <p className="font-semibold text-lg">Clientra</p>
          <p className="text-muted-foreground text-sm">{workspaceLabel}</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link
                    activeProps={{ "data-active": true }}
                    className="block"
                    to={item.href}
                  >
                    {({ isActive }) => (
                      <SidebarMenuButton active={isActive}>
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
          <div className="rounded-md border bg-background p-3 text-sm">
            <p className="font-medium">{user?.name ?? "Loading account"}</p>
            <p className="truncate text-muted-foreground text-xs">
              {user?.email ?? "Checking session..."}
            </p>
          </div>
          <SignOutButton className="w-full" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="border-b bg-background px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Clientra</p>
            <SignOutButton />
          </div>
          <nav className="mt-3 flex flex-wrap gap-2">
            {adminNav.map((item) => (
              <Link
                activeProps={{
                  className: "bg-primary text-primary-foreground",
                }}
                className="rounded-md border px-2 py-1 text-sm"
                key={item.href}
                to={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
