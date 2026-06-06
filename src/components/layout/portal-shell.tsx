"use client";

import {
  Activity01Icon,
  Briefcase01Icon,
  DashboardSquare01Icon,
  File01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const logoUrl = "/logo.webp";

const portalNav = [
  { href: "/portal", label: "Overview", icon: DashboardSquare01Icon, exact: true },
  { href: "/portal/projects", label: "Projects", icon: Briefcase01Icon },
  { href: "/portal/files", label: "Files", icon: File01Icon },
  { href: "/portal/activity", label: "Activity", icon: Activity01Icon },
  { href: "/portal/team", label: "Team", icon: UserGroupIcon },
] as const;

function PortalNavUser() {
  const session = authClient.useSession();
  const user = session.data?.user as
    | { email?: string; name?: string; role?: string; image?: string }
    | undefined;

  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      queryClient.clear();
      await router.navigate({ to: "/login" });
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="relative ml-auto h-8 w-8 rounded-full"
            variant="ghost"
          />
        }
      >
        <Avatar className="h-8 w-8">
          {user.image && (
            <AvatarImage alt={user.name ?? "User avatar"} src={user.image} />
          )}
          <AvatarFallback className="border border-border bg-card font-medium text-card-foreground text-xs shadow-xs">
            {user.name?.[0]?.toUpperCase() ?? "C"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none">{user.name}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PortalSidebarNav() {
  const { open, isMobile } = useSidebar();
  const showText = isMobile || open;

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center gap-2">
          <img
            alt="Clientra Logo"
            className="h-8 w-auto shrink-0"
            height={32}
            src={logoUrl}
            width={32}
          />
          {showText && (
            <div className="flex flex-col min-w-0">
              <span className="truncate font-semibold text-foreground text-lg tracking-tight transition-opacity duration-200">
                Clientra
              </span>
              <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-bold text-[9px] text-primary uppercase tracking-wider w-fit">
                Client Portal
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-medium text-[10px] text-muted-foreground/50 uppercase tracking-wider">
            Portal
          </SidebarGroupLabel>
          <SidebarMenu>
            {portalNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link
                  activeOptions={item.exact ? { exact: true } : undefined}
                  className="block"
                  to={item.href}
                >
                  {({ isActive }) => (
                    <SidebarMenuButton
                      active={isActive}
                      aria-label={showText ? undefined : item.label}
                      className={
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                      title={showText ? undefined : item.label}
                    >
                      <HugeiconsIcon
                        className="shrink-0"
                        icon={item.icon}
                        size={18}
                        strokeWidth={isActive ? 2 : 1.5}
                      />
                      {showText && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  )}
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <PortalSidebarNav />
      <SidebarInset className="h-svh overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground text-sm">Client Portal</span>
          </div>
          <PortalNavUser />
        </header>
        <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
