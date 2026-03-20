import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import { useProjectsData } from "@/lib/api";

export const Route = createFileRoute("/portal/projects/")({
  beforeLoad: requireClientSession,
  component: PortalProjectsPage,
});

function PortalProjectsPage() {
  const projectsQuery = useProjectsData();

  return (
    <PortalShell>
      <h1 className="mb-4 font-semibold text-2xl">Your Projects</h1>
      {projectsQuery.isLoading ? <LoadingPanel /> : null}
      {!projectsQuery.isLoading && projectsQuery.error ? (
        <ErrorPanel description={projectsQuery.error} />
      ) : null}
      {!(projectsQuery.isLoading || projectsQuery.error) &&
      (projectsQuery.data?.length ?? 0) === 0 ? (
        <EmptyPanel
          description="Your visible projects will appear here."
          title="No projects available"
        />
      ) : null}
      {!(projectsQuery.isLoading || projectsQuery.error) &&
      (projectsQuery.data?.length ?? 0) > 0 ? (
        <div className="grid gap-3">
          {projectsQuery.data?.map((project) => (
            <div className="rounded-xl border bg-white p-4" key={project.id}>
              <div className="mb-2 flex items-center justify-between">
                <Link
                  className="font-medium underline"
                  params={{ id: project.id }}
                  to="/portal/projects/$id"
                >
                  {project.title}
                </Link>
                <StatusBadge value={project.status} />
              </div>
              <p className="text-slate-600 text-sm">
                Deadline: {project.deadline}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </PortalShell>
  );
}
