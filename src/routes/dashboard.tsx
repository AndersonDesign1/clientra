import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/auth/guards";
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
        <h1 className="mb-6 font-semibold text-2xl">Admin Dashboard</h1>
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
      const deadline = Date.parse(project.deadline);
      return Number.isFinite(deadline) && deadline > Date.now();
    }).length,
  };

  return (
    <AppShell>
      <h1 className="mb-6 font-semibold text-2xl">Admin Dashboard</h1>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total clients"
          value={dashboardMetrics.totalClients}
        />
        <MetricCard
          label="Active projects"
          value={dashboardMetrics.activeProjects}
        />
        <MetricCard
          label="Upcoming deadlines"
          value={dashboardMetrics.upcomingDeadlines}
        />
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium text-lg">Recent activity</h2>
        <DashboardActivityList activity={activity} />
      </section>
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
    <ol className="space-y-3">
      {activity.map((event) => (
        <li className="rounded-lg border border-slate-200 p-3" key={event.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900 text-sm">
              {formatDashboardActivityTitle(event)}
            </p>
            <time className="text-slate-500 text-xs" dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleString()}
            </time>
          </div>
          <p className="mt-2 text-slate-600 text-sm leading-6">
            {formatDashboardActivityDescription(event)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="font-semibold text-3xl">{value}</p>
    </div>
  );
}
