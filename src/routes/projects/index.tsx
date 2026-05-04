import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  DeleteProjectDialog,
  ProjectFormDialog,
} from "@/components/admin/crud-dialogs";
import {
  BudgetBarChart,
  DeadlineBarChart,
  StatusBarChart,
} from "@/components/common/product-charts";
import { DataSection, PageHeader } from "@/components/common/product-ui";
import { ProjectsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/features/projects/mock-data";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
} from "@/lib/api";
import {
  getBudgetByStatusData,
  getDeadlineData,
  getDeadlineLabel,
  getProjectStatusData,
} from "@/lib/insights";
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
      <PageHeader
        actions={
          <ProjectFormDialog
            clients={clients}
            onOpenChange={setIsCreateOpen}
            open={isCreateOpen}
            trigger={<Button>New project</Button>}
          />
        }
        description="Track delivery status, deadlines, and budget concentration across all active work."
        title="Projects"
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
        <>
          <DataSection title="Delivery shape">
            <div className="grid gap-6 xl:grid-cols-3">
              <StatusBarChart
                data={getProjectStatusData(projectsQuery.data ?? [])}
              />
              <DeadlineBarChart
                data={getDeadlineData(projectsQuery.data ?? [])}
              />
              <BudgetBarChart
                data={getBudgetByStatusData(projectsQuery.data ?? [])}
              />
            </div>
          </DataSection>
          <DataSection title="Project register">
            <div className="overflow-x-auto border-slate-200 border-y bg-white">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsQuery.data?.map((project) => {
                    const { clientSlug, projectSlug } = getProjectPathParams(
                      project,
                      clients
                    );

                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Link
                            className="font-medium text-zinc-950 hover:underline"
                            params={{ clientSlug, projectSlug }}
                            to="/projects/$clientSlug/$projectSlug"
                          >
                            {project.title}
                          </Link>
                          <p className="mt-1 max-w-lg text-slate-600 text-xs">
                            {project.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={project.status} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          ${project.budget.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getDeadlineLabel(project.deadline)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
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
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="destructive"
                                >
                                  Delete
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DataSection>
        </>
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
