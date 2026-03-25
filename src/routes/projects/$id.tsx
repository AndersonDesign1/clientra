import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/auth/guards";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import { projectTimeline } from "@/features/projects/mock-data";
import {
  ensureProjectFilesData,
  ensureProjectsData,
  useProjectsData,
} from "@/lib/api";

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: requireAdminSession,
  loader: ({ context, params }) =>
    Promise.all([
      ensureProjectsData(context.queryClient),
      ensureProjectFilesData(context.queryClient, params.id),
    ]),
  component: AdminProjectDetailPage,
});

function AdminProjectDetailPage() {
  const { id } = Route.useParams();
  const projectsQuery = useProjectsData();

  if (projectsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingPanel />
      </AppShell>
    );
  }

  if (projectsQuery.error) {
    return (
      <AppShell>
        <ErrorPanel
          description={projectsQuery.error || "We couldn't load this project."}
        />
      </AppShell>
    );
  }

  const project = projectsQuery.data?.find((entry) => entry.id === id);

  if (!project) {
    return (
      <AppShell>
        <ErrorPanel
          description="We could not find a project with that id."
          title="Project not found"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">{project.title}</h1>
          <p className="mt-1 text-slate-600 text-sm">{project.description}</p>
        </div>
        <StatusBadge value={project.status} />
      </div>
      <div className="mb-4 rounded-xl border bg-white p-4 text-sm">
        <p>
          Budget: ${project.budget.toLocaleString()} · Deadline:{" "}
          {project.deadline || "No deadline yet"}
        </p>
      </div>
      <section className="mb-4 rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-medium">Activity timeline</h2>
        <ul className="space-y-2 text-slate-600 text-sm">
          {projectTimeline.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>
      <ProjectFilesPanel canDelete projectId={project.id} />
    </AppShell>
  );
}
