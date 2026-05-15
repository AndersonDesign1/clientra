import {
  Briefcase01Icon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Settings01Icon,
  UserGroupIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
];

function SidebarNav() {
  const { open } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary font-bold text-primary-foreground shadow-sm">
            C
          </div>
          {open && (
            <div className="min-w-0 transition-opacity duration-200">
              <p className="truncate font-bold text-foreground text-lg tracking-tight">
                Clientra
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-medium text-muted-foreground/80 text-xs">
            General
          </SidebarGroupLabel>
          <SidebarMenu>
            {adminNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link className="block" to={item.href}>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      active={isActive}
                      className={
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                      title={open ? undefined : item.label}
                    >
                      <HugeiconsIcon
                        className="shrink-0"
                        icon={item.icon}
                        size={18}
                        strokeWidth={isActive ? 2 : 1.5}
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
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link className="block" to="/settings">
                {({ isActive }) => (
                  <SidebarMenuButton
                    active={isActive}
                    className={
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                    title={open ? undefined : "Settings"}
                  >
                    <HugeiconsIcon
                      className="shrink-0"
                      icon={Settings01Icon}
                      size={18}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    {open && <span>Settings</span>}
                  </SidebarMenuButton>
                )}
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-disabled
                className="pointer-events-none cursor-default text-muted-foreground/70"
                title={open ? undefined : "Help & Support (coming soon)"}
              >
                <HugeiconsIcon
                  className="shrink-0"
                  icon={HelpCircleIcon}
                  size={18}
                  strokeWidth={1.5}
                />
                {open && <span>Help & Support</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUser() {
  const session = authClient.useSession();
  const user = session.data?.user as
    | { email?: string; name?: string; role?: string }
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

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="relative ml-auto h-8 w-8 rounded-full"
          variant="ghost"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 font-medium text-emerald-800 text-xs">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" forceMount>
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

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="h-svh overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground text-sm">Admin</span>
          </div>
          <NavUser />
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
          <Link
            activeProps={{
              className: "bg-accent text-accent-foreground",
            }}
            className="rounded-md px-2 py-1 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            to="/settings"
          >
            Settings
          </Link>
        </nav>
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
