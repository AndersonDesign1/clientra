import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ── Sidebar context ─────────────────────────────────────────────────────────

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────

function SidebarProvider({
  children,
  className,
  defaultOpen = true,
  style,
  ...props
}: React.ComponentProps<"div"> & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const toggleSidebar = useCallback(() => setOpen((prev) => !prev), []);

  // Keyboard shortcut: Ctrl+B / Cmd+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  const value = useMemo(
    () => ({ open, setOpen, toggleSidebar }),
    [open, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        data-slot="sidebar-wrapper"
        data-state={open ? "expanded" : "collapsed"}
        style={
          {
            "--sidebar-width": "15rem",
            "--sidebar-width-icon": "3.5rem",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ── Trigger ─────────────────────────────────────────────────────────────────

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      type="button"
      {...props}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect height="18" rx="2" width="18" x="3" y="3" />
        <path d="M9 3v18" />
      </svg>
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  const { open } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col overflow-hidden border-sidebar-border border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex",
        className
      )}
      data-slot="sidebar"
      data-state={open ? "expanded" : "collapsed"}
      style={{
        width: open ? "var(--sidebar-width)" : "var(--sidebar-width-icon)",
      }}
      {...props}
    />
  );
}

// ── Inset ───────────────────────────────────────────────────────────────────

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn("min-w-0 flex-1 bg-background", className)}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 p-4", className)}
      data-slot="sidebar-header"
      {...props}
    />
  );
}

// ── Content ─────────────────────────────────────────────────────────────────

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-2",
        className
      )}
      data-slot="sidebar-content"
      {...props}
    />
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

// ── Group ────────────────────────────────────────────────────────────────────

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      data-slot="sidebar-group"
      {...props}
    />
  );
}

// ── Group Label ─────────────────────────────────────────────────────────────

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "px-2 py-1 font-medium text-sidebar-foreground/60 text-xs transition-opacity duration-200",
        !open && "h-0 overflow-hidden py-0 opacity-0",
        className
      )}
      data-slot="sidebar-group-label"
      {...props}
    />
  );
}

// ── Menu ────────────────────────────────────────────────────────────────────

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex min-w-0 flex-col gap-1", className)}
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

// ── Menu Item ───────────────────────────────────────────────────────────────

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("min-w-0", className)}
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

// ── Menu Button ─────────────────────────────────────────────────────────────

const sidebarMenuButtonVariants = cva(
  "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>span:last-child]:truncate",
  {
    variants: {
      active: {
        true: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        false: "text-sidebar-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

function SidebarMenuButton({
  active,
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof sidebarMenuButtonVariants>) {
  return (
    <div
      className={cn(sidebarMenuButtonVariants({ active, className }))}
      data-active={active}
      data-slot="sidebar-menu-button"
      {...props}
    />
  );
}

// ── Separator ───────────────────────────────────────────────────────────────

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-2 h-px bg-sidebar-border", className)}
      data-slot="sidebar-separator"
      {...props}
    />
  );
}

export {
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
};
