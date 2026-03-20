import { createFileRoute } from "@tanstack/react-router";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { AppShell } from "@/components/layout/app-shell";
import { recentActivity } from "@/features/dashboard/mock-data";
import { useClientsData, useProjectsData } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

  if (clientsQuery.isLoading || projectsQuery.isLoading) {
    return (
      <AppShell>
        <h1 className="mb-6 font-semibold text-2xl">Admin Dashboard</h1>
        <LoadingPanel />
      </AppShell>
    );
  }

  if (clientsQuery.error || projectsQuery.error) {
    return (
      <AppShell>
        <h1 className="mb-6 font-semibold text-2xl">Admin Dashboard</h1>
        <ErrorPanel
          description={clientsQuery.error ?? projectsQuery.error ?? undefined}
        />
      </AppShell>
    );
  }

  const clients = clientsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
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
        <ul className="space-y-2 text-slate-600 text-sm">
          {recentActivity.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>
    </AppShell>
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
