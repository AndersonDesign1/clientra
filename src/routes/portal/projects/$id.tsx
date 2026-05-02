import { createFileRoute } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import {
  DataSection,
  DefinitionGrid,
  PageHeader,
} from "@/components/common/product-ui";
import { PortalProjectDetailPendingPage } from "@/components/common/route-pending";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { formatStatusLabel } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import { ProjectCollaborationPanel } from "@/components/projects/project-collaboration-panel";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import { ProjectMilestonesPanel } from "@/components/projects/project-milestones-panel";
import { ProjectUpdatesPanel } from "@/components/projects/project-updates-panel";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import {
  findProjectByClientAndProjectPathParams,
  findProjectByPathParam,
} from "@/lib/project-slugs";

export const Route = createFileRoute("/portal/projects/$id")({
  beforeLoad: requireClientSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: PortalProjectDetailPendingPage,
  component: LegacyPortalProjectDetailRoute,
});

function LegacyPortalProjectDetailRoute() {
  const { id } = Route.useParams();

  return <PortalProjectDetailPage projectSlug={id} />;
}

export function PortalProjectDetailPage({
  clientSlug,
  projectSlug,
}: {
  clientSlug?: string;
  projectSlug: string;
}) {
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

  if (projectsQuery.isLoading || clientsQuery.isLoading) {
    return (
      <PortalShell>
        <LoadingPanel />
      </PortalShell>
    );
  }

  if (projectsQuery.error || clientsQuery.error) {
    return (
      <PortalShell>
        <ErrorPanel
          description={projectsQuery.error ?? clientsQuery.error ?? undefined}
        />
      </PortalShell>
    );
  }

  const clients = clientsQuery.data ?? [];
  const project = clientSlug
    ? findProjectByClientAndProjectPathParams({
        clients,
        clientSlug,
        projects: projectsQuery.data ?? [],
        projectSlug,
      })
    : findProjectByPathParam(projectsQuery.data ?? [], projectSlug);

  if (!project) {
    return (
      <PortalShell>
        <ErrorPanel
          description="We could not find a project with that id."
          title="Project not found"
        />
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <PageHeader description={project.description} title={project.title} />
      <DataSection title="Project details">
        <DefinitionGrid
          items={[
            { label: "Status", value: formatStatusLabel(project.status) },
            { label: "Deadline", value: getDeadlineLabel(project.deadline) },
          ]}
        />
      </DataSection>
      <DataSection title="Updates">
        <ProjectUpdatesPanel canManage={false} projectId={project.id} />
      </DataSection>
      <DataSection title="Milestones">
        <ProjectMilestonesPanel canManage={false} projectId={project.id} />
      </DataSection>
      <DataSection title="Discussion and activity">
        <ProjectCollaborationPanel projectId={project.id} />
      </DataSection>
      <DataSection title="Files">
        <ProjectFilesPanel canDelete={false} projectId={project.id} />
      </DataSection>
    </PortalShell>
  );
}
