import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/product-ui";
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
  const cardSkeletons = [
    "client-s-1",
    "client-s-2",
    "client-s-3",
    "client-s-4",
    "client-s-5",
    "client-s-6",
  ];

  return (
    <AdminPendingShell testId="clients-route-pending">
      <PageHeader
        actions={
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        }
        description="Manage client records, linked projects, and invite-ready accounts."
        title="Clients"
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cardSkeletons.map((id) => (
          <div
            className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-card p-5"
            key={id}
          >
            <div className="space-y-4">
              {/* Card Header Skeleton */}
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <Skeleton className="h-5 w-16" />
              </div>

              {/* Card Body Skeleton */}
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
              </div>
            </div>

            {/* Separator / Footer Skeleton */}
            <div className="mt-5 flex items-center justify-between gap-4 border-border/60 border-t pt-4">
              {/* Projects Pill Skeleton */}
              <Skeleton className="h-6 w-20" />

              {/* Actions Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPendingShell>
  );
}

export function ClientDetailPendingPage() {
  const dossierItems = [
    "dossier-s-1",
    "dossier-s-2",
    "dossier-s-3",
    "dossier-s-4",
    "dossier-s-5",
    "dossier-s-6",
  ];
  const projectSkeletons = ["project-s-1", "project-s-2"];
  const inviteSkeletons = ["invite-s-1", "invite-s-2"];

  return (
    <AdminPendingShell testId="client-detail-route-pending">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        }
        description={<Skeleton className="mt-1.5 h-4 w-32" />}
        title={<Skeleton className="h-9 w-48" />}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Dossier */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none md:col-span-1">
          <h2 className="font-semibold text-foreground text-sm">
            Client Record
          </h2>
          <div className="space-y-3">
            {dossierItems.map((id) => (
              <div className="space-y-1" key={id}>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Linked Projects & Pending Invites */}
        <div className="space-y-6 md:col-span-2">
          {/* Linked Projects */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none">
            <h2 className="font-semibold text-foreground text-sm">
              Linked Projects
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {projectSkeletons.map((id) => (
                <div
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border/50 bg-card/40 p-4"
                  key={id}
                >
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">
                Pending Invites
              </h2>
              <Skeleton className="h-5 w-16" />
            </div>

            <div className="divide-y divide-border/60 border-border/60 border-t">
              {inviteSkeletons.map((id) => (
                <div
                  className="grid items-center gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_6rem_8rem_8rem_9rem]"
                  key={id}
                >
                  <Skeleton className="h-4 w-32" />
                  <div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-24" />
                  <div className="flex items-center justify-end gap-2 sm:justify-start">
                    <Skeleton className="h-8 w-14" />
                    <Skeleton className="h-8 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
