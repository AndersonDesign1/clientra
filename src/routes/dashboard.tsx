import {
  Comment01Icon,
  File01Icon,
  FolderAddIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { UnifiedActivityList } from "@/components/common/activity-list";
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
import { cn } from "@/lib/utils";

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

interface ChartCardProps {
  center?: boolean;
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  title: string;
}

function ChartCard({
  title,
  delayMs = 150,
  className,
  center = true,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "group flex min-w-0 animate-slide-up-fade flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
        {title}
      </div>
      {center ? (
        <div className="flex w-full min-w-0 flex-1 items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="min-w-0 flex-1">{children}</div>
      )}
    </div>
  );
}

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
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard delayMs={150} title="Project Status">
            <ProjectStatusPieChart
              data={getProjectStatusData(projects)}
              isLoading={isLoading}
            />
          </ChartCard>
          <ChartCard
            className="lg:col-span-2"
            delayMs={200}
            title="Activity Flow"
          >
            <ActivitySankeyChart
              data={getActivitySankeyData(activity)}
              isLoading={isLoading}
            />
          </ChartCard>
        </div>

        {/* Row 2: Deadlines + Budget + Recent Activity */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChartCard delayMs={250} title="Deadlines">
            <DeadlineAreaChart
              data={getDeadlineData(projects)}
              isLoading={isLoading}
            />
          </ChartCard>
          <ChartCard delayMs={300} title="Budget by Status">
            <BudgetComposedChart
              data={getBudgetByStatusData(projects)}
              isLoading={isLoading}
            />
          </ChartCard>
          <ChartCard
            center={false}
            className="md:col-span-2 lg:col-span-1"
            delayMs={350}
            title="Recent activity"
          >
            <CompactActivityList activity={activity} isLoading={isLoading} />
          </ChartCard>
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

const COMPACT_LIMIT = 4;

function CompactActivityList({
  activity,
  isLoading,
}: {
  activity: DashboardActivityEvent[];
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleActivity = expanded
    ? activity
    : activity.slice(0, COMPACT_LIMIT);

  const items = visibleActivity.map((event) => ({
    id: event.id,
    icon: EVENT_ICONS[event.type],
    iconBgClass: EVENT_BG_COLORS[event.type],
    iconColorClass: EVENT_COLORS[event.type],
    title: formatDashboardActivityTitle(event),
    body: formatDashboardActivityDescription(event),
    time: formatRelativeTime(event.createdAt),
    rawItem: event,
  }));

  return (
    <div>
      <UnifiedActivityList
        emptyState={
          <EmptyPanel
            description="New clients, projects, comments, and files will appear here."
            title="No recent activity"
          />
        }
        isLoading={isLoading}
        items={items}
      />

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
