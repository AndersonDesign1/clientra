import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
}) {
  return (
    <div className="mb-6 flex animate-slide-up-fade flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-semibold text-[10px] text-primary uppercase tracking-widest">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-bold text-3xl text-[#08361f] tracking-tight dark:text-primary">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl font-normal text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function DataSection({
  actions,
  children,
  className,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section className={cn("py-5 first:pt-0", className)}>
      {title || actions || description ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="font-semibold text-foreground text-sm">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-muted-foreground text-xs">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricLedger({
  isLoading,
  items,
}: {
  isLoading?: boolean;
  items: Array<{
    label: string;
    value: ReactNode;
    detail?: ReactNode;
  }>;
}) {
  const columnCount = Math.min(Math.max(items.length, 1), 4) as 1 | 2 | 3 | 4;
  const columnClass = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  }[columnCount];

  return (
    <dl className={cn("grid gap-4", columnClass)}>
      {items.map((item, index) => (
        <div
          className="group relative animate-slide-up-fade overflow-hidden rounded-xl border border-border/70 bg-card p-6 shadow-none transition-all duration-300 hover:border-border hover:shadow-none"
          key={item.label}
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <dt className="font-semibold text-[10px] text-muted-foreground/80 uppercase leading-none tracking-wider">
            {item.label}
          </dt>
          {isLoading ? (
            <div className="mt-3.5 space-y-2">
              <Skeleton className="h-8 w-16" />
              {item.detail ? (
                <Skeleton className="h-3.5 w-24" />
              ) : (
                <div className="h-3.5" />
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-1">
              <dd className="font-bold text-3xl text-[#08361f] tabular-nums leading-none tracking-tight md:text-4xl dark:text-primary">
                {item.value}
              </dd>
              {item.detail ? (
                <dd className="mt-0.5 font-normal text-muted-foreground text-xs leading-normal">
                  {item.detail}
                </dd>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </dl>
  );
}

export function DefinitionGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid divide-y divide-border border-border border-y text-sm md:grid-cols-2 md:divide-x md:divide-y-0">
      {items.map((item) => (
        <div className="grid gap-1 py-3 md:px-4 md:first:pl-0" key={item.label}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TimelineList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ol
      className={cn("divide-y divide-border border-border border-y", className)}
    >
      {children}
    </ol>
  );
}

export function TimelineItem({
  children,
  time,
}: {
  children: ReactNode;
  time?: ReactNode;
}) {
  return (
    <li className="grid gap-2 py-3 text-sm md:grid-cols-[minmax(0,1fr)_11rem] md:items-start">
      <div>{children}</div>
      {time ? (
        <div className="text-muted-foreground text-xs md:text-right">
          {time}
        </div>
      ) : null}
    </li>
  );
}
