import { createFileRoute } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { PortalProjectDetailPendingPage } from "@/components/common/route-pending";
import { ProjectCollaborationPanel } from "@/components/projects/project-collaboration-panel";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import {
  ensureProjectCollaborationData,
  ensureProjectFilesData,
  ensureProjectsData,
  useProjectsData,
} from "@/lib/api";

export const Route = createFileRoute("/portal/projects/$id")({
  beforeLoad: requireClientSession,
  loader: ({ context, params }) =>
    Promise.all([
      ensureProjectCollaborationData(context.queryClient, params.id),
      ensureProjectsData(context.queryClient),
      ensureProjectFilesData(context.queryClient, params.id),
    ]),
  pendingComponent: PortalProjectDetailPendingPage,
  component: PortalProjectDetailPage,
});

function PortalProjectDetailPage() {
  const { id } = Route.useParams();
  const projectsQuery = useProjectsData();

  if (projectsQuery.isLoading) {
    return (
      <PortalShell>
        <LoadingPanel />
      </PortalShell>
    );
  }

  if (projectsQuery.error) {
    return (
      <PortalShell>
        <ErrorPanel description={projectsQuery.error} />
      </PortalShell>
    );
  }

  const project = projectsQuery.data?.find((entry) => entry.id === id);

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
      <h1 className="mb-2 font-semibold text-2xl">{project.title}</h1>
      <p className="mb-4 text-slate-600 text-sm">{project.description}</p>
      <div className="mb-4">
        <ProjectCollaborationPanel projectId={project.id} />
      </div>
      <ProjectFilesPanel canDelete={false} projectId={project.id} />
    </PortalShell>
  );
}
