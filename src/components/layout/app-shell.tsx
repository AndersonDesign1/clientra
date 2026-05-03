import {
  Briefcase01Icon,
  DashboardSquare01Icon,
  Settings01Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const adminNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: UserMultipleIcon,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: Briefcase01Icon,
  },
  {
    href: "/users",
    label: "Users",
    icon: UserGroupIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings01Icon,
  },
];

function SidebarNav() {
  const { open } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground text-xs">
            C
          </div>
          {open && (
            <div className="min-w-0 transition-opacity duration-200">
              <p className="truncate font-semibold text-sm tracking-tight">
                Clientra
              </p>
            </div>
          )}
        </div>
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
                      title={open ? undefined : item.label}
                    >
                      <HugeiconsIcon
                        className="shrink-0"
                        icon={item.icon}
                        size={18}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                      {open && <span>{item.label}</span>}
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
        <FooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}

function FooterContent() {
  const { open } = useSidebar();
  const session = authClient.useSession();
  const user = session.data?.user as
    | { email?: string; name?: string; role?: string }
    | undefined;

  if (!open) {
    return <SignOutButton className="w-full" variant="ghost" />;
  }

  return (
    <>
      <div className="border-sidebar-border border-t pt-3 text-sm">
        <p className="truncate font-medium">
          {user?.name ?? "Loading account"}
        </p>
        <p className="truncate text-muted-foreground text-xs">
          {user?.email ?? "Checking session..."}
        </p>
      </div>
      <SignOutButton className="w-full" />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="h-svh overflow-auto">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <span className="text-muted-foreground text-sm">Admin</span>
        </header>
        {/* Mobile nav fallback */}
        <nav className="flex flex-wrap gap-2 border-b px-4 py-2 md:hidden">
          {adminNav.map((item) => (
            <Link
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
              className="rounded-md px-2 py-1 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              key={item.href}
              to={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
