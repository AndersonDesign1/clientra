import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ActivityListItemProps<T> {
  badge?: ReactNode;
  body?: ReactNode;
  // Action handles
  canManage?: boolean;
  // Inner timeline dot indicator configuration (optional)
  dotInnerBgClass?: string;
  footer?: ReactNode;
  // Icon configuration (optional)
  // biome-ignore lint/suspicious/noExplicitAny: support raw hugeicons objects
  icon?: any;
  iconBgClass?: string;
  iconColorClass?: string;
  id: string;
  onDelete?: (item: T) => void;
  onEdit?: (item: T) => void;
  rawItem: T;
  // Right time block
  time: ReactNode;
  // Content block
  title: ReactNode;
  titleClass?: string;
}

export function UnifiedActivityList<T>({
  items,
  isLoading,
  emptyState,
}: {
  items: ActivityListItemProps<T>[];
  isLoading?: boolean;
  emptyState?: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static loading skeletons
          <div className="flex items-start gap-3" key={i}>
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="relative flex flex-col divide-y divide-border/15">
      {/* Visual vertical timeline connector line linking icons */}
      <div className="pointer-events-none absolute top-6 bottom-6 left-[27.5px] w-[1.5px] bg-border/25" />

      {items.map((item) => (
        <div
          className="group relative flex items-start gap-3 rounded-lg px-3.5 py-3 transition-colors hover:bg-accent/40"
          key={item.id}
        >
          {/* Badge Icon */}
          {item.icon && (
            <div
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background transition-transform duration-300 group-hover:scale-105",
                item.iconBgClass || "bg-secondary",
                item.iconColorClass || "text-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon as never}
                size={14}
                strokeWidth={2}
              />
            </div>
          )}

          {/* Timeline Dot Indicator */}
          {!item.icon && item.dotInnerBgClass && (
            <div
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background transition-all duration-300 group-hover:scale-105",
                item.iconBgClass || "bg-secondary",
                item.iconColorClass || "text-foreground"
              )}
            >
              <div
                className={cn("h-1.5 w-1.5 rounded-full", item.dotInnerBgClass)}
              />
            </div>
          )}

          {/* Content Block */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "font-medium text-foreground text-xs leading-5 transition-colors group-hover:text-accent-foreground",
                  item.titleClass
                )}
              >
                {item.title}
              </div>
              {item.badge}
            </div>

            {item.body ? (
              <div className="mt-0.5 whitespace-pre-wrap text-[11px] text-muted-foreground leading-normal">
                {item.body}
              </div>
            ) : null}

            {item.footer ? (
              <div className="mt-1.5 font-semibold text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {item.footer}
              </div>
            ) : null}
          </div>

          {/* Time / Actions */}
          <div className="relative ml-2 flex h-5 min-w-16 shrink-0 items-center justify-end">
            <span className="select-none text-[11px] text-muted-foreground leading-5 transition-opacity duration-200 group-hover:opacity-0">
              {item.time}
            </span>

            {item.canManage ? (
              <div className="pointer-events-none absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 rounded bg-background pl-2 opacity-0 transition-opacity duration-200 group-focus-within:pointer-events-auto group-focus-within:bg-accent/40 group-focus-within:opacity-100 group-hover:bg-accent/40 group-hover:opacity-100">
                {item.onEdit && (
                  <Button
                    className="h-6 border border-border/40 bg-background px-2 font-bold text-[10px] text-foreground transition-transform duration-200 hover:scale-105 hover:bg-muted active:scale-95"
                    onClick={() => item.onEdit?.(item.rawItem)}
                    type="button"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
                {item.onDelete && (
                  <Button
                    className="h-6 w-6 border border-border/40 bg-background p-0 text-muted-foreground transition-transform duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                    onClick={() => item.onDelete?.(item.rawItem)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={10} />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
