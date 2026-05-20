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
import logoUrl from "/logo.webp";

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
            <span className="truncate font-semibold text-foreground text-lg tracking-tight transition-opacity duration-200">
              Clientra
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-medium text-[10px] text-muted-foreground/50 uppercase tracking-wider">
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
                    title={showText ? undefined : "Settings"}
                  >
                    <HugeiconsIcon
                      className="shrink-0"
                      icon={Settings01Icon}
                      size={18}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    {showText && <span>Settings</span>}
                  </SidebarMenuButton>
                )}
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-disabled
                className="pointer-events-none cursor-default text-muted-foreground/70"
                title={showText ? undefined : "Help & Support (coming soon)"}
              >
                <HugeiconsIcon
                  className="shrink-0"
                  icon={HelpCircleIcon}
                  size={18}
                  strokeWidth={1.5}
                />
                {showText && <span>Help & Support</span>}
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
      <DropdownMenuTrigger>
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
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
