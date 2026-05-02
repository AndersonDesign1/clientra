import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/auth/guards";
import {
  ActivityRadialChart,
  BudgetLineChart,
  DeadlineAreaChart,
  StatusBarChart,
} from "@/components/common/product-charts";
import {
  DataSection,
  MetricLedger,
  PageHeader,
  TimelineItem,
  TimelineList,
} from "@/components/common/product-ui";
import { DashboardPendingPage } from "@/components/common/route-pending";
import { EmptyPanel, ErrorPanel } from "@/components/common/state-panel";
import { AppShell } from "@/components/layout/app-shell";
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
  getActivityTypeData,
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

  if (
    activityQuery.isLoading ||
    clientsQuery.isLoading ||
    projectsQuery.isLoading
  ) {
    // Intentionally reused for both route-level pending UI and query-driven
    // refreshes while this page still owns its own AppShell wrapper.
    return <DashboardPendingPage />;
  }

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
      <DataSection
        className="mt-6"
        description="Status, deadline, budget, and activity distribution from live workspace data."
        title="Delivery shape"
      >
        <div className="grid gap-6 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <StatusBarChart data={getProjectStatusData(projects)} />
          </div>
          <DeadlineAreaChart data={getDeadlineData(projects)} />
          <ActivityRadialChart data={getActivityTypeData(activity)} />
        </div>
        <div className="mt-5">
          <BudgetLineChart data={getBudgetByStatusData(projects)} />
        </div>
      </DataSection>
      <DataSection title="Recent activity">
        <DashboardActivityList activity={activity} />
      </DataSection>
    </AppShell>
  );
}

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

export function DashboardActivityList({
  activity,
}: {
  activity: DashboardActivityEvent[];
}) {
  if (activity.length === 0) {
    return (
      <EmptyPanel
        description="New clients, projects, comments, and files will appear here."
        title="No recent activity"
      />
    );
  }

  return (
    <TimelineList>
      {activity.map((event) => (
        <TimelineItem
          key={event.id}
          time={
            <time dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleString()}
            </time>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900 text-sm">
              {formatDashboardActivityTitle(event)}
            </p>
          </div>
          <p className="mt-2 text-slate-600 text-sm leading-6">
            {formatDashboardActivityDescription(event)}
          </p>
        </TimelineItem>
      ))}
    </TimelineList>
  );
}
