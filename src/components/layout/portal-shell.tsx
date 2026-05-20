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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import logoUrl from "/logo.webp";

const portalNav = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/projects", label: "Projects" },
] as const;

export function PortalShell({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <SidebarProvider className="bg-stone-50 text-zinc-950">
      <Sidebar className="bg-stone-100/70">
        <SidebarHeader>
          <div className="mb-2 flex items-center gap-1.5">
            <img
              alt="Clientra Logo"
              className="h-5 w-auto"
              height={20}
              src={logoUrl}
              width={20}
            />
            <p className="font-semibold text-lg tracking-tight">
              Clientra Portal
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
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
      <SidebarInset className="bg-stone-50">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-stone-100/80 px-4 backdrop-blur-md md:hidden">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-1 items-center gap-1.5">
            <img
              alt="Clientra Logo"
              className="h-5 w-auto"
              height={20}
              src={logoUrl}
              width={20}
            />
            <p className="font-semibold text-sm tracking-tight">
              Clientra Portal
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-7">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
