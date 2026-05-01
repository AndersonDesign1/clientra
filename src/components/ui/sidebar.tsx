import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

function SidebarProvider({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-h-svh w-full bg-background", className)}
      data-slot="sidebar-wrapper"
      style={
        {
          "--sidebar-width": "15rem",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      className={cn(
        "hidden w-(--sidebar-width) shrink-0 flex-col border-sidebar-border border-r bg-sidebar text-sidebar-foreground md:flex",
        className
      )}
      data-slot="sidebar"
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn("min-w-0 flex-1 bg-background", className)}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 p-4", className)}
      data-slot="sidebar-header"
      {...props}
    />
  );
}

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

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-slot="sidebar-footer"
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      data-slot="sidebar-group"
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-2 py-1 font-medium text-sidebar-foreground/60 text-xs",
        className
      )}
      data-slot="sidebar-group-label"
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex min-w-0 flex-col gap-1", className)}
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("min-w-0", className)}
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>span:last-child]:truncate",
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
};
