import { createFileRoute } from "@tanstack/react-router";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { useProjectsData } from "@/lib/api";

export const Route = createFileRoute("/projects/")({ component: ProjectsPage });

function ProjectsPage() {
  const projectsQuery = useProjectsData();

  return (
    <AppShell>
      <h1 className="mb-4 font-semibold text-2xl">Projects</h1>
      {projectsQuery.isLoading ? <LoadingPanel /> : null}
      {!projectsQuery.isLoading && projectsQuery.error ? (
        <ErrorPanel description={projectsQuery.error} />
      ) : null}
      {!(projectsQuery.isLoading || projectsQuery.error) &&
      (projectsQuery.data?.length ?? 0) === 0 ? (
        <EmptyPanel
          description="Project records will appear here once they are available."
          title="No projects yet"
        />
      ) : null}
      {!(projectsQuery.isLoading || projectsQuery.error) &&
      (projectsQuery.data?.length ?? 0) > 0 ? (
        <div className="grid gap-3">
          {projectsQuery.data?.map((project) => (
            <div className="rounded-xl border bg-white p-4" key={project.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-medium">{project.title}</h2>
                <StatusBadge value={project.status} />
              </div>
              <p className="text-slate-600 text-sm">{project.description}</p>
              <p className="mt-2 text-sm">
                Budget: ${project.budget.toLocaleString()} · Deadline:{" "}
                {project.deadline}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
