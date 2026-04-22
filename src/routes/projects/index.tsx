import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  DeleteProjectDialog,
  ProjectFormDialog,
} from "@/components/admin/crud-dialogs";
import { ProjectsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import type { Project } from "@/features/projects/mock-data";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
} from "@/lib/api";
import { getProjectPathParams } from "@/lib/project-slugs";

export const Route = createFileRoute("/projects/")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: ProjectsPendingPage,
  component: ProjectsPage,
});

function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();
  const clients = clientsQuery.data ?? [];

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl">Projects</h1>
        <ProjectFormDialog
          clients={clients}
          onOpenChange={setIsCreateOpen}
          open={isCreateOpen}
          trigger={<Button>New project</Button>}
        />
      </div>
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
          description="Create your first project once a client is available."
          title="No projects yet"
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
              clients
            );

            return (
              <div className="rounded-xl border bg-white p-4" key={project.id}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-medium">
                    <Link
                      className="hover:underline"
                      params={{ clientSlug, projectSlug }}
                      to="/projects/$clientSlug/$projectSlug"
                    >
                      {project.title}
                    </Link>
                  </h2>
                  <StatusBadge value={project.status} />
                </div>
                <p className="text-slate-600 text-sm">{project.description}</p>
                <p className="mt-2 text-sm">
                  Budget: ${project.budget.toLocaleString()} · Deadline:{" "}
                  {project.deadline}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => setEditingProject(project)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <DeleteProjectDialog
                    project={project}
                    trigger={
                      <Button size="sm" type="button" variant="destructive">
                        Delete
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {editingProject ? (
        <ProjectFormDialog
          clients={clients}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProject(null);
            }
          }}
          open={Boolean(editingProject)}
          project={editingProject}
          trigger={null}
        />
      ) : null}
    </AppShell>
  );
}
