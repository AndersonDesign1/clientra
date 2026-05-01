"use client";

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
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const portalNav = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/projects", label: "Projects" },
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <p className="font-semibold text-lg">Clientra Portal</p>
          <p className="text-muted-foreground text-sm">
            {user?.name ? `Signed in as ${user.name}` : "Secure client access"}
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Portal</SidebarGroupLabel>
            <SidebarMenu>
              {portalNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link
                    activeOptions={
                      item.href === "/portal" ? { exact: true } : undefined
                    }
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
        <SidebarFooter>
          <SignOutButton className="w-full" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="border-b bg-background px-4 py-3 md:hidden">
          <p className="font-semibold">Clientra Portal</p>
          <nav className="mt-3 flex flex-wrap gap-2">
            {portalNav.map((item) => (
              <Link
                activeOptions={
                  item.href === "/portal" ? { exact: true } : undefined
                }
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
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
