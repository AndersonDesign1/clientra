import type { ReactNode } from "react";
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-slate-200 border-b pb-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-slate-500 text-xs">{eyebrow}</p>
        ) : null}
        <h1 className="font-semibold text-2xl text-zinc-950 tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-slate-600 text-sm leading-6">
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
    <section
      className={cn(
        "border-slate-200 border-t py-5 first:border-t-0 first:pt-0",
        className
      )}
    >
      {title || actions || description ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="font-medium text-base text-zinc-950">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-slate-600 text-sm">{description}</p>
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
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    detail?: ReactNode;
  }>;
}) {
  return (
    <dl className="grid border-slate-200 border-y sm:grid-cols-3">
      {items.map((item) => (
        <div
          className="border-slate-200 border-b py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:px-5 sm:last:border-r-0 sm:first:pl-0"
          key={item.label}
        >
          <dt className="text-slate-500 text-sm">{item.label}</dt>
          <dd className="mt-1 font-semibold text-3xl text-zinc-950 tabular-nums">
            {item.value}
          </dd>
          {item.detail ? (
            <dd className="mt-1 text-slate-600 text-xs">{item.detail}</dd>
          ) : null}
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
    <dl className="grid divide-y divide-slate-200 border-slate-200 border-y text-sm md:grid-cols-2 md:divide-x md:divide-y-0">
      {items.map((item) => (
        <div className="grid gap-1 py-3 md:px-4 md:first:pl-0" key={item.label}>
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="font-medium text-zinc-950">{item.value}</dd>
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
      className={cn(
        "divide-y divide-slate-200 border-slate-200 border-y",
        className
      )}
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
        <div className="text-slate-500 text-xs md:text-right">{time}</div>
      ) : null}
    </li>
  );
}
