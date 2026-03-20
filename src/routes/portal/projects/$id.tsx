import { createFileRoute } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { projectTimeline } from "@/features/projects/mock-data";
import { useProjectsData } from "@/lib/api";

export const Route = createFileRoute("/portal/projects/$id")({
  beforeLoad: requireClientSession,
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
      <section className="mb-4 rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-medium">Activity timeline</h2>
        <ul className="space-y-2 text-slate-600 text-sm">
          {projectTimeline.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border bg-white p-4 text-slate-600 text-sm">
        <p>Files: upload/download UI placeholder</p>
        <p>Comments: client feedback thread placeholder</p>
      </section>
    </PortalShell>
  );
}
