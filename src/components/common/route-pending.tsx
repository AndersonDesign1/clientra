import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PortalShell } from "@/components/layout/portal-shell";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingShellProps {
  children: ReactNode;
  testId: string;
}

function AdminPendingShell({ children, testId }: PendingShellProps) {
  return (
    <AppShell>
      <div className="space-y-6" data-testid={testId}>
        {children}
      </div>
    </AppShell>
  );
}

function PortalPendingShell({ children, testId }: PendingShellProps) {
  return (
    <PortalShell>
      <div className="space-y-6" data-testid={testId}>
        {children}
      </div>
    </PortalShell>
  );
}

function PendingHeader({
  descriptionWidth,
  title,
}: {
  descriptionWidth: string;
  title: string;
}) {
  return (
    <div>
      <h1 className="font-semibold text-2xl">{title}</h1>
      <Skeleton className={`mt-2 h-4 ${descriptionWidth}`} />
    </div>
  );
}

function TableCardSkeleton({
  columns,
  rows,
}: {
  columns: string[];
  rows: number;
}) {
  const rowKeys = Array.from(
    { length: rows },
    (_, index) => `row-${index + 1}`
  );

  return (
    <div className="overflow-hidden border-slate-200 border-y bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            {columns.map((column) => (
              <th className="p-3" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rowKey) => (
            <tr className="border-t" key={rowKey}>
              {columns.map((column, columnIndex) => (
                <td className="p-3" key={`${column}-${rowKey}`}>
                  <Skeleton
                    className={
                      columnIndex === columns.length - 1
                        ? "ml-auto h-8 w-20"
                        : "h-4 w-full max-w-[11rem]"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineCardSkeleton() {
  return (
    <section className="border-slate-200 border-y py-4">
      <Skeleton className="h-5 w-36" />
      <div className="mt-4 space-y-3">
        {["1", "2", "3", "4"].map((key) => (
          <Skeleton className="h-4 w-full last:w-5/6" key={key} />
        ))}
      </div>
    </section>
  );
}

function DetailSummarySkeleton() {
  return (
    <div className="mb-4 border-slate-200 border-y py-4 text-sm">
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function DashboardPendingPage() {
  return (
    <AdminPendingShell testId="dashboard-route-pending">
      <PendingHeader descriptionWidth="w-52" title="Admin Dashboard" />
      <div className="grid gap-4 md:grid-cols-3">
        {["clients", "projects", "deadlines"].map((key) => (
          <div className="border-slate-200 border-y py-4" key={key}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-20" />
          </div>
        ))}
      </div>
      <TimelineCardSkeleton />
    </AdminPendingShell>
  );
}

export function SettingsPendingPage() {
  return (
    <AdminPendingShell testId="settings-route-pending">
      <PendingHeader descriptionWidth="w-64" title="Settings" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border-slate-200 border-y py-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>
        </section>
        <section className="border-slate-200 border-y py-4">
          <Skeleton className="h-6 w-32" />
          <div className="mt-4 space-y-3">
            {["google-local", "google-prod", "github-local", "github-prod"].map(
              (key) => (
                <Skeleton className="h-4 w-full" key={key} />
              )
            )}
          </div>
        </section>
      </div>
    </AdminPendingShell>
  );
}

export function UsersPendingPage() {
  return (
    <AdminPendingShell testId="users-route-pending">
      <PendingHeader descriptionWidth="w-80" title="Users" />
      <TableCardSkeleton
        columns={[
          "Name",
          "Email",
          "Role",
          "Verified",
          "Joined",
          "Providers",
          "Actions",
        ]}
        rows={5}
      />
    </AdminPendingShell>
  );
}

export function ClientsPendingPage() {
  return (
    <AdminPendingShell testId="clients-route-pending">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-semibold text-2xl">Clients</h1>
        <Skeleton className="h-10 w-64" />
      </div>
      <TableCardSkeleton
        columns={["Name", "Company", "Email", "Status"]}
        rows={6}
      />
    </AdminPendingShell>
  );
}

export function ClientDetailPendingPage() {
  return (
    <AdminPendingShell testId="client-detail-route-pending">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <section className="space-y-4 border-slate-200 border-y py-4 text-sm">
        {["contact", "email", "phone", "website", "notes"].map((key) => (
          <Skeleton className="h-4 w-full max-w-xl" key={key} />
        ))}
      </section>
    </AdminPendingShell>
  );
}

export function ProjectsPendingPage() {
  return (
    <AdminPendingShell testId="projects-route-pending">
      <PendingHeader descriptionWidth="w-56" title="Projects" />
      <div className="grid gap-3">
        {["1", "2", "3"].map((key) => (
          <section className="border-slate-200 border-y py-4" key={key}>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </section>
        ))}
      </div>
    </AdminPendingShell>
  );
}

export function ProjectDetailPendingPage() {
  return (
    <AdminPendingShell testId="project-detail-route-pending">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <DetailSummarySkeleton />
      <TimelineCardSkeleton />
      <section className="border-slate-200 border-y py-4">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          {["1", "2", "3"].map((key) => (
            <Skeleton className="h-12 w-full" key={key} />
          ))}
        </div>
      </section>
    </AdminPendingShell>
  );
}

export function PortalHomePendingPage() {
  return (
    <PortalPendingShell testId="portal-home-route-pending">
      <PendingHeader descriptionWidth="w-56" title="Client Portal" />
      <Skeleton className="h-4 w-32" />
      <section className="border-slate-200 border-y py-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
      </section>
    </PortalPendingShell>
  );
}

export function PortalProjectsPendingPage() {
  return (
    <PortalPendingShell testId="portal-projects-route-pending">
      <PendingHeader descriptionWidth="w-60" title="Your Projects" />
      <div className="grid gap-3">
        {["1", "2", "3"].map((key) => (
          <section className="border-slate-200 border-y py-4" key={key}>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="mt-3 h-4 w-40" />
          </section>
        ))}
      </div>
    </PortalPendingShell>
  );
}

export function PortalProjectDetailPendingPage() {
  return (
    <PortalPendingShell testId="portal-project-detail-route-pending">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <TimelineCardSkeleton />
      <section className="border-slate-200 border-y py-4">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          {["1", "2", "3"].map((key) => (
            <Skeleton className="h-12 w-full" key={key} />
          ))}
        </div>
      </section>
    </PortalPendingShell>
  );
}
