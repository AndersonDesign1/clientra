import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";

export function formatStatusLabel(value: string) {
  const normalized = value.replaceAll("_", " ");

  return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
}

export function StatusBadge({ value }: { value: string }) {
  let variant: ComponentProps<typeof Badge>["variant"] = "secondary";

  if (value === "archived") {
    variant = "outline";
  } else if (value === "completed") {
    variant = "default";
  } else if (value === "planning") {
    variant = "outline";
  }

  return <Badge variant={variant}>{formatStatusLabel(value)}</Badge>;
}
