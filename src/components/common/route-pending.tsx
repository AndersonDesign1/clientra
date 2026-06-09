import type { ReactNode } from "react";
import { PageHeader } from "@/components/common/product-ui";
import { AppShell } from "@/components/layout/app-shell";
import { PortalShell } from "@/components/layout/portal-shell";
import { Skeleton } from "@/components/ui/skeleton";

const CLIENTS_CARD_SKELETONS = [
  "client-s-1",
  "client-s-2",
  "client-s-3",
  "client-s-4",
  "client-s-5",
  "client-s-6",
];

const CLIENT_DETAIL_DOSSIER_ITEMS = [
  "dossier-s-1",
  "dossier-s-2",
  "dossier-s-3",
  "dossier-s-4",
  "dossier-s-5",
  "dossier-s-6",
];
const CLIENT_DETAIL_PROJECT_SKELETONS = ["project-s-1", "project-s-2"];
const CLIENT_DETAIL_INVITE_SKELETONS = ["invite-s-1", "invite-s-2"];

const PROJECT_DETAIL_MILESTONES_SKELETONS = ["milestone-s-1", "milestone-s-2"];
const PROJECT_DETAIL_COMMENT_SKELETONS = ["comment-s-1", "comment-s-2", "comment-s-3"];
const PROJECT_DETAIL_FILE_SKELETONS = ["file-s-1", "file-s-2"];
const PROJECT_DETAIL_UPDATE_SKELETONS = ["update-s-1", "update-s-2"];

const PORTAL_HOME_CARD_SKELETONS = ["active-s-1", "active-s-2"];
const PORTAL_PROJECTS_CARD_SKELETONS = ["proj-s-1", "proj-s-2", "proj-s-3"];

const PORTAL_PROJECT_DETAIL_MILESTONES_SKELETONS = ["milestone-s-1", "milestone-s-2"];
const PORTAL_PROJECT_DETAIL_COMMENT_SKELETONS = ["comment-s-1", "comment-s-2"];
const PORTAL_PROJECT_DETAIL_FILE_SKELETONS = ["file-s-1", "file-s-2"];
const PORTAL_PROJECT_DETAIL_UPDATE_SKELETONS = ["update-s-1", "update-s-2"];


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
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                className="p-4 font-bold text-xs uppercase tracking-wider"
                key={column}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/15">
          {rowKeys.map((rowKey) => (
            <tr className="transition-colors hover:bg-muted/5" key={rowKey}>
              {columns.map((column, columnIndex) => (
                <td className="p-4" key={`${column}-${rowKey}`}>
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

export function DashboardPendingPage() {
  return (
    <AdminPendingShell testId="dashboard-route-pending">
      <PageHeader
        description="A compact view of delivery load, project mix, deadlines, and the latest workspace activity."
        title="Admin Dashboard"
      />
      {/* MetricLedger Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {["clients", "projects", "deadlines"].map((key) => (
          <div
            className="rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]"
            key={key}
          >
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-4 h-9 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Delivery shape skeleton section */}
      <div className="mt-8 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">
            Delivery shape
          </h2>
          <Skeleton className="mt-1.5 h-3.5 w-72" />
        </div>

        {/* Row 1: Project Status + Activity Flow */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="border-border/40 border-b pb-3">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-48 items-center justify-center pt-4">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] md:col-span-2">
            <div className="border-border/40 border-b pb-3">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex h-48 flex-col justify-between pt-4">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Row 2: Deadlines + Budget + Recent Activity */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="border-border/40 border-b pb-3">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="flex h-48 items-end justify-between pt-4">
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((key, i) => (
                <Skeleton
                  className="w-6 rounded bg-muted/60"
                  key={key}
                  style={{ height: `${20 + i * 15}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="border-border/40 border-b pb-3">
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="flex h-48 items-end justify-between gap-2 pt-4">
              {["s1", "s2", "s3", "s4"].map((key, i) => (
                <Skeleton
                  className="w-full rounded bg-muted/60"
                  key={key}
                  style={{ height: `${40 + (i % 2) * 20}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="border-border/40 border-b pb-3">
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="relative mt-4 space-y-4 pt-1">
              <div className="absolute top-5 bottom-5 left-[13px] w-[1.5px] bg-border/20" />
              {["s1", "s2", "s3"].map((key) => (
                <div
                  className="relative z-10 flex items-start gap-3.5"
                  key={key}
                >
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full border border-border/30 bg-background" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminPendingShell>
  );
}

export function SettingsPendingPage() {
  return (
    <AdminPendingShell testId="settings-route-pending">
      <PendingHeader descriptionWidth="w-64" title="Settings" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
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
        <section className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
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
        {CLIENTS_CARD_SKELETONS.map((id) => (
          <div
            className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/40 bg-card p-5"
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
        <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] md:col-span-1">
          <h2 className="font-semibold text-foreground text-sm">
            Client Record
          </h2>
          <div className="space-y-3">
            {CLIENT_DETAIL_DOSSIER_ITEMS.map((id) => (
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
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <h2 className="font-semibold text-foreground text-sm">
              Linked Projects
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {CLIENT_DETAIL_PROJECT_SKELETONS.map((id) => (
                <div
                  className="flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card/30 p-4.5"
                  key={id}
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 border-border/40 border-t pt-3">
                      <Skeleton className="h-3.5 w-20" />
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground text-sm">
                Pending Invites
              </h2>
              <Skeleton className="h-5 w-16" />
            </div>

            <div className="divide-y divide-border/60 border-border/60 border-t">
              {CLIENT_DETAIL_INVITE_SKELETONS.map((id) => (
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
      <PageHeader
        actions={
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        }
        description="Monitor budgets, track milestones, and publish project status reports."
        title="Projects"
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {["1", "2", "3", "4", "5", "6"].map((key) => (
          <div
            className="flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]"
            key={key}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5.5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <div className="space-y-3 border-border/40 border-t pt-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4.5 w-20" />
                <Skeleton className="h-4.5 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPendingShell>
  );
}

export function ProjectDetailPendingPage() {
  return (
    <AdminPendingShell testId="project-detail-route-pending">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column Skeletons */}
        <div className="space-y-6 lg:col-span-2">
          {/* Project Overview skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <Skeleton className="h-4.5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>

          {/* Milestones list skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {PROJECT_DETAIL_MILESTONES_SKELETONS.map((id) => (
                <div
                  className="space-y-3 rounded-xl border border-border/40 bg-card p-4.5"
                  key={id}
                >
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration list skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Discussion Column */}
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-1 h-3.5 w-64" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
                <div className="space-y-4">
                  {PROJECT_DETAIL_COMMENT_SKELETONS.map((id) => (
                    <div
                      className="flex items-start gap-3.5 border-border/40 border-b py-4 last:border-0"
                      key={id}
                    >
                      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                      <div className="w-full space-y-2 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3.5 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline Column */}
              <div className="space-y-5">
                <div className="border-border/40 border-b pb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-1 h-3.5 w-64" />
                </div>
                <div className="relative space-y-4 pt-1">
                  <div className="absolute top-5 bottom-5 left-[13px] w-[1.5px] bg-border/20" />
                  {["s1", "s2", "s3"].map((key) => (
                    <div
                      className="relative z-10 flex items-start gap-3.5"
                      key={key}
                    >
                      <Skeleton className="h-7 w-7 shrink-0 rounded-full border border-border/30 bg-background" />
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-10 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column Skeletons */}
        <div className="space-y-6 lg:col-span-1">
          {/* Budget Widget skeleton */}
          <div className="space-y-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-full" />
          </div>

          {/* Timeline Widget skeleton */}
          <div className="space-y-3 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3.5 w-28" />
          </div>

          {/* Parent Client Widget skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="w-full space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center justify-between border-border/40 border-t pt-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Files Panel skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="space-y-2">
              {PROJECT_DETAIL_FILE_SKELETONS.map((id) => (
                <div
                  className="flex items-center justify-between border-border/40 border-b py-2 last:border-0"
                  key={id}
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Updates Panel skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="space-y-3">
              {PROJECT_DETAIL_UPDATE_SKELETONS.map((id) => (
                <div
                  className="flex items-start gap-3 border-border/40 border-b py-2 last:border-0"
                  key={id}
                >
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="w-full space-y-1">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-20" />
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

export function PortalHomePendingPage() {
  return (
    <PortalPendingShell testId="portal-home-route-pending">
      <PageHeader
        actions={<Skeleton className="h-4 w-32" />}
        description={<Skeleton className="mt-1.5 h-4 w-80" />}
        title="Client Portal"
      />

      {/* Metrics Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {["metrics-1", "metrics-2", "metrics-3"].map((key) => (
          <div
            className="rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]"
            key={key}
          >
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-4 h-9 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="mt-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[240px] w-full rounded-lg" />
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
      </div>

      {/* Active Work Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PORTAL_HOME_CARD_SKELETONS.map((id) => (
            <div
              className="flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]"
              key={id}
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-border/40 border-t pt-3">
                  <Skeleton className="h-3.5 w-20" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalPendingShell>
  );
}

export function PortalProjectsPendingPage() {
  return (
    <PortalPendingShell testId="portal-projects-route-pending">
      <PageHeader
        description={<Skeleton className="mt-1.5 h-4 w-60" />}
        title="Your Projects"
      />
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {PORTAL_PROJECTS_CARD_SKELETONS.map((id) => (
            <div
              className="flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]"
              key={id}
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-border/40 border-t pt-3">
                  <Skeleton className="h-3.5 w-20" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column Skeletons */}
        <div className="space-y-6 lg:col-span-2">
          {/* Project Overview skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <Skeleton className="h-4.5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>

          {/* Milestones list skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {PORTAL_PROJECT_DETAIL_MILESTONES_SKELETONS.map((id) => (
                <div
                  className="space-y-3 rounded-xl border border-border/40 bg-card p-4.5"
                  key={id}
                >
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration list skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Discussion Column */}
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-1 h-3.5 w-64" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
                <div className="space-y-4">
                  {PORTAL_PROJECT_DETAIL_COMMENT_SKELETONS.map((id) => (
                    <div
                      className="flex items-start gap-3.5 border-border/40 border-b py-4 last:border-0"
                      key={id}
                    >
                      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                      <div className="w-full space-y-2 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3.5 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline Column */}
              <div className="space-y-5">
                <div className="border-border/40 border-b pb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-1 h-3.5 w-64" />
                </div>
                <div className="relative space-y-4 pt-1">
                  <div className="absolute top-5 bottom-5 left-[13px] w-[1.5px] bg-border/20" />
                  {["s1", "s2"].map((key) => (
                    <div
                      className="relative z-10 flex items-start gap-3.5"
                      key={key}
                    >
                      <Skeleton className="h-7 w-7 shrink-0 rounded-full border border-border/30 bg-background" />
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-10 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column Skeletons */}
        <div className="space-y-6 lg:col-span-1">
          {/* Budget Widget skeleton */}
          <div className="space-y-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-full" />
          </div>

          {/* Timeline Widget skeleton */}
          <div className="space-y-3 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3.5 w-28" />
          </div>

          {/* Files Panel skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="space-y-2">
              {PORTAL_PROJECT_DETAIL_FILE_SKELETONS.map((id) => (
                <div
                  className="flex items-center justify-between border-border/40 border-b py-2 last:border-0"
                  key={id}
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Updates Panel skeleton */}
          <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="space-y-3">
              {PORTAL_PROJECT_DETAIL_UPDATE_SKELETONS.map((id) => (
                <div
                  className="flex items-start gap-3 border-border/40 border-b py-2 last:border-0"
                  key={id}
                >
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="w-full space-y-1">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalPendingShell>
  );
}
