import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { useProjectsData } from "@/lib/api";

export const Route = createFileRoute("/portal/")({
  beforeLoad: requireClientSession,
  component: PortalHomePage,
});

function PortalHomePage() {
  const projectsQuery = useProjectsData();

  return (
    <PortalShell>
      <h1 className="mb-2 font-semibold text-2xl">Client Portal</h1>
      <p className="mb-4 text-slate-600 text-sm">
        Track your projects and recent updates.
      </p>
      <Link className="underline" to="/portal/projects">
        View all projects
      </Link>
      <div className="mt-4 rounded-xl border bg-white p-4">
        {projectsQuery.isLoading ? (
          <LoadingPanel
            description="We are loading the latest portal projects."
            title="Loading projects"
          />
        ) : null}
        {!projectsQuery.isLoading && projectsQuery.error ? (
          <ErrorPanel description={projectsQuery.error} />
        ) : null}
        {projectsQuery.isLoading || projectsQuery.error ? null : (
          <p className="text-slate-500 text-sm">
            Projects in your portal: {projectsQuery.data?.length ?? 0}
          </p>
        )}
      </div>
    </PortalShell>
  );
}
