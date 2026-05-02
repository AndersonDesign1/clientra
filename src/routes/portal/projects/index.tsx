import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { DataSection, PageHeader } from "@/components/common/product-ui";
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
import { getDeadlineLabel } from "@/lib/insights";
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
      <PageHeader
        description="A clean register of every project currently visible to your account."
        title="Your Projects"
      />
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
        <DataSection title="Project register">
          <div className="divide-y divide-slate-200 border-slate-200 border-y">
            {projectsQuery.data?.map((project) => {
              const { clientSlug, projectSlug } = getProjectPathParams(
                project,
                clientsQuery.data ?? []
              );

              return (
                <div
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_10rem] sm:items-center"
                  key={project.id}
                >
                  <Link
                    className="font-medium text-zinc-950 hover:underline"
                    params={{ clientSlug, projectSlug }}
                    to="/portal/projects/$clientSlug/$projectSlug"
                  >
                    {project.title}
                  </Link>
                  <StatusBadge value={project.status} />
                  <p className="text-slate-600">
                    {getDeadlineLabel(project.deadline)}
                  </p>
                </div>
              );
            })}
          </div>
        </DataSection>
      ) : null}
    </PortalShell>
  );
}
