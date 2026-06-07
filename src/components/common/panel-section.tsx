import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "card" | "ghost";
}

export function PanelSection({
  title,
  description,
  action,
  children,
  className,
  variant = "card",
}: PanelSectionProps) {
  return (
    <section
      className={cn(
        "space-y-5",
        variant === "card" &&
          "rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2
            className={cn(
              "font-semibold text-foreground",
              variant === "card" ? "text-lg" : "text-base"
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                "mt-1 text-muted-foreground leading-relaxed",
                variant === "card" ? "text-sm" : "text-xs"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
