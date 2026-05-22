import {
  Comment01Icon,
  File01Icon,
  FolderAddIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ActivitySankeyChart,
  BudgetComposedChart,
  DeadlineAreaChart,
  ProjectStatusPieChart,
} from "@/components/common/product-charts";
import {
  DataSection,
  MetricLedger,
  PageHeader,
} from "@/components/common/product-ui";
import { DashboardPendingPage } from "@/components/common/route-pending";
import { EmptyPanel, ErrorPanel } from "@/components/common/state-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type DashboardActivityEvent,
  ensureClientsData,
  ensureDashboardActivityData,
  ensureProjectsData,
  useClientsData,
  useDashboardActivityData,
  useProjectsData,
} from "@/lib/api";
import {
  getActivitySankeyData,
  getBudgetByStatusData,
  getDeadlineData,
  getDeadlineLabel,
  getNextDeadline,
  getProjectStatusData,
  parseDateOnlyLocal,
} from "@/lib/insights";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAdminSession,
  loader: async ({ context }) => {
    await Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]);

    return ensureDashboardActivityData(context.queryClient);
  },
  pendingComponent: DashboardPendingPage,
  component: DashboardPage,
});

function DashboardPage() {
  const activityQuery = useDashboardActivityData();
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

  const isLoading =
    activityQuery.isLoading ||
    clientsQuery.isLoading ||
    projectsQuery.isLoading;

  if (activityQuery.error || clientsQuery.error || projectsQuery.error) {
    return (
      <AppShell>
        <PageHeader title="Admin Dashboard" />
        <ErrorPanel
          description={
            activityQuery.error ??
            clientsQuery.error ??
            projectsQuery.error ??
            undefined
          }
        />
      </AppShell>
    );
  }

  const clients = clientsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const dashboardMetrics = {
    totalClients: clients.length,
    activeProjects: projects.filter(
      (project) => project.status === "in_progress"
    ).length,
    upcomingDeadlines: projects.filter((project) => {
      const deadline = parseDateOnlyLocal(project.deadline);
      if (!deadline) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return deadline.getTime() >= today.getTime();
    }).length,
  };
  const nextDeadline = getNextDeadline(projects);

  return (
    <AppShell>
      <PageHeader
        description="A compact view of delivery load, project mix, deadlines, and the latest workspace activity."
        title="Admin Dashboard"
      />
      <MetricLedger
        isLoading={isLoading}
        items={[
          {
            label: "Total clients",
            value: dashboardMetrics.totalClients,
            detail: `${clients.filter((client) => client.status === "active").length} active`,
          },
          {
            label: "Active projects",
            value: dashboardMetrics.activeProjects,
            detail: `${projects.length} total projects`,
          },
          {
            label: "Next deadline",
            value: nextDeadline
              ? getDeadlineLabel(nextDeadline.deadline)
              : "None",
            detail: nextDeadline?.title ?? "No upcoming project date",
          },
        ]}
      />

      {/* ── Delivery shape ─────────────────────────────────────────── */}
      <DataSection
        className="mt-8"
        description="Status, deadline, budget, and activity distribution from live workspace data."
        title="Delivery shape"
      >
        {/* Row 1: Project Status + Activity Sankey */}
        <div className="grid gap-4 md:grid-cols-3">
          <div
            className="group flex animate-slide-up-fade flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
            style={{ animationDelay: "150ms" }}
          >
            <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
              Project Status
            </div>
            <div>
              <ProjectStatusPieChart
                data={getProjectStatusData(projects)}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div
            className="group flex animate-slide-up-fade flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)] md:col-span-2"
            style={{ animationDelay: "200ms" }}
          >
            <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
              Activity Flow
            </div>
            <div>
              <ActivitySankeyChart
                data={getActivitySankeyData(activity)}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Deadlines + Budget + Recent Activity */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div
            className="group flex animate-slide-up-fade flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
            style={{ animationDelay: "250ms" }}
          >
            <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
              Deadlines
            </div>
            <div>
              <DeadlineAreaChart
                data={getDeadlineData(projects)}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div
            className="group flex animate-slide-up-fade flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
            style={{ animationDelay: "300ms" }}
          >
            <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
              Budget by Status
            </div>
            <div>
              <BudgetComposedChart
                data={getBudgetByStatusData(projects)}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div
            className="group flex animate-slide-up-fade flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
            style={{ animationDelay: "350ms" }}
          >
            <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
              Recent activity
            </div>
            <div>
              <CompactActivityList activity={activity} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </DataSection>
    </AppShell>
  );
}

// ── Activity event helpers ────────────────────────────────────────────────────

const EVENT_ICONS: Record<DashboardActivityEvent["type"], unknown> = {
  client_created: UserAdd01Icon,
  project_created: FolderAddIcon,
  comment_added: Comment01Icon,
  file_uploaded: File01Icon,
};

const EVENT_COLORS: Record<DashboardActivityEvent["type"], string> = {
  client_created: "text-emerald-600",
  project_created: "text-teal-600",
  comment_added: "text-sky-600",
  file_uploaded: "text-amber-600",
};

const EVENT_BG_COLORS: Record<DashboardActivityEvent["type"], string> = {
  client_created: "bg-emerald-50",
  project_created: "bg-teal-50",
  comment_added: "bg-sky-50",
  file_uploaded: "bg-amber-50",
};

export function formatDashboardActivityTitle(event: DashboardActivityEvent) {
  switch (event.type) {
    case "client_created":
      return `Client added: ${event.clientName}`;
    case "project_created":
      return `Project created: ${event.projectTitle}`;
    case "comment_added":
      return `${event.authorName} commented on ${event.projectTitle}`;
    case "file_uploaded":
      return `${event.authorName} uploaded ${event.fileName}`;
    default:
      return "Dashboard activity";
  }
}

export function formatDashboardActivityDescription(
  event: DashboardActivityEvent
) {
  switch (event.type) {
    case "client_created":
      return event.company;
    case "project_created":
      return `Project is now tracked for ${event.clientName}.`;
    case "comment_added":
      return event.contentPreview;
    case "file_uploaded":
      return `Shared on ${event.projectTitle}.`;
    default:
      return "Workspace activity was updated.";
  }
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  if (date.getTime() > now.getTime()) {
    return "Just now";
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Compact activity list ─────────────────────────────────────────────────────

const COMPACT_LIMIT = 5;

function CompactActivityList({
  activity,
  isLoading,
}: {
  activity: DashboardActivityEvent[];
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton array
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

  if (activity.length === 0) {
    return (
      <EmptyPanel
        description="New clients, projects, comments, and files will appear here."
        title="No recent activity"
      />
    );
  }

  const visibleActivity = expanded
    ? activity
    : activity.slice(0, COMPACT_LIMIT);

  return (
    <div>
      <div className="flex flex-col gap-1">
        {visibleActivity.map((event) => (
          <div
            className="flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-muted/50"
            key={event.id}
          >
            {/* Icon */}
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${EVENT_BG_COLORS[event.type]} ${EVENT_COLORS[event.type]}`}
            >
              <HugeiconsIcon
                icon={EVENT_ICONS[event.type] as never}
                size={14}
                strokeWidth={2}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground text-xs leading-5">
                {formatDashboardActivityTitle(event)}
              </p>
              <p className="truncate text-[11px] text-muted-foreground leading-4">
                {formatDashboardActivityDescription(event)}
              </p>
            </div>

            {/* Time */}
            <time
              className="shrink-0 text-[11px] text-muted-foreground leading-5"
              dateTime={event.createdAt}
            >
              {formatRelativeTime(event.createdAt)}
            </time>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {activity.length > COMPACT_LIMIT && (
        <div className="mt-3 flex justify-center">
          <Button
            className="h-7 font-medium text-xs"
            onClick={() => setExpanded(!expanded)}
            size="sm"
            variant="ghost"
          >
            {expanded ? "Show less" : `View all ${activity.length} events`}
          </Button>
        </div>
      )}
    </div>
  );
}

// Keep legacy exports for any other consumers
export { CompactActivityList as DashboardActivityList };
