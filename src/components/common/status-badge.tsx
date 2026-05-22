import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function formatStatusLabel(value: string) {
  const normalized = value.replaceAll("_", " ");
  return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
}

export function StatusBadge({ value }: { value: string }) {
  const status = value.toLowerCase();

  let statusStyles = "bg-muted text-muted-foreground border-border/50";

  if (status === "active" || status === "completed" || status === "on_track") {
    statusStyles =
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  } else if (status === "in_progress" || status === "pending") {
    statusStyles =
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  } else if (status === "planning") {
    statusStyles =
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
  } else if (status === "archived") {
    statusStyles =
      "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20";
  } else if (status === "at_risk" || status === "blocked") {
    statusStyles =
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
  }

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-0.5 font-bold text-[0.65rem] uppercase tracking-wider transition-all duration-200",
        statusStyles
      )}
      variant={null}
    >
      {formatStatusLabel(value)}
    </Badge>
  );
}
