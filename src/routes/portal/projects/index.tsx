import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { PortalProjectsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
} from "@/lib/api";
import { getProjectPathParams } from "@/lib/project-slugs";

export const Route = createFileRoute("/portal/projects/")({
  beforeLoad: requireClientSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: PortalProjectsPendingPage,
  component: PortalProjectsPage,
});

function PortalProjectsPage() {
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

  return (
    <PortalShell>
      <h1 className="mb-4 font-semibold text-2xl">Your Projects</h1>
      {projectsQuery.isLoading || clientsQuery.isLoading ? (
        <LoadingPanel />
      ) : null}
      {!(projectsQuery.isLoading || clientsQuery.isLoading) &&
      (projectsQuery.error || clientsQuery.error) ? (
        <ErrorPanel
          description={projectsQuery.error ?? clientsQuery.error ?? undefined}
        />
      ) : null}
      {!(
        projectsQuery.isLoading ||
        clientsQuery.isLoading ||
        projectsQuery.error ||
        clientsQuery.error
      ) && (projectsQuery.data?.length ?? 0) === 0 ? (
        <EmptyPanel
          description="Your visible projects will appear here."
          title="No projects available"
        />
      ) : null}
      {!(
        projectsQuery.isLoading ||
        clientsQuery.isLoading ||
        projectsQuery.error ||
        clientsQuery.error
      ) && (projectsQuery.data?.length ?? 0) > 0 ? (
        <div className="grid gap-3">
          {projectsQuery.data?.map((project) => {
            const { clientSlug, projectSlug } = getProjectPathParams(
              project,
              clientsQuery.data ?? []
            );

            return (
              <div className="rounded-xl border bg-white p-4" key={project.id}>
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    className="font-medium underline"
                    params={{ clientSlug, projectSlug }}
                    to="/portal/projects/$clientSlug/$projectSlug"
                  >
                    {project.title}
                  </Link>
                  <StatusBadge value={project.status} />
                </div>
                <p className="text-slate-600 text-sm">
                  Deadline: {project.deadline}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </PortalShell>
  );
}
