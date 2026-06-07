import type { ReactNode } from "react";

interface PanelSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  description,
  action,
  children,
  className,
}: PanelSectionProps) {
  return (
    <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">{title}</h2>
          {description && (
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
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
