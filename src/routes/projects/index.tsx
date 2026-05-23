import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  DeleteProjectDialog,
  ProjectFormDialog,
} from "@/components/admin/crud-dialogs";
import {
  BudgetComposedChart,
  DeadlineAreaChart,
  ProjectStatusPieChart,
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
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Project Status
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <ProjectStatusPieChart
                    data={getProjectStatusData(projectsQuery.data ?? [])}
                  />
                </div>
              </div>
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Deadlines
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <DeadlineAreaChart
                    data={getDeadlineData(projectsQuery.data ?? [])}
                  />
                </div>
              </div>
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Budget by Status
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <BudgetComposedChart
                    data={getBudgetByStatusData(projectsQuery.data ?? [])}
                  />
                </div>
              </div>
            </div>
          </DataSection>
          <DataSection title="Project register">
            <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">
                      Project
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">
                      Budget
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">
                      Deadline
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/15">
                  {projectsQuery.data?.map((project) => {
                    const { clientSlug, projectSlug } = getProjectPathParams(
                      project,
                      clients
                    );

                    return (
                      <TableRow
                        className="transition-colors hover:bg-muted/5"
                        key={project.id}
                      >
                        <TableCell className="p-4">
                          <Link
                            className="font-medium text-foreground transition-colors hover:text-primary"
                            params={{ clientSlug, projectSlug }}
                            to="/projects/$clientSlug/$projectSlug"
                          >
                            {project.title}
                          </Link>
                          <p className="mt-1 max-w-lg text-muted-foreground text-xs leading-relaxed">
                            {project.description}
                          </p>
                        </TableCell>
                        <TableCell className="p-4">
                          <StatusBadge value={project.status} />
                        </TableCell>
                        <TableCell className="p-4 font-medium tabular-nums">
                          ${project.budget.toLocaleString()}
                        </TableCell>
                        <TableCell className="p-4">
                          {getDeadlineLabel(project.deadline)}
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              className="h-8 border border-border/40 px-3 font-semibold text-xs transition-transform duration-200 hover:scale-105 active:scale-95"
                              onClick={() => setEditingProject(project)}
                              type="button"
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <DeleteProjectDialog
                              project={project}
                              trigger={
                                <Button
                                  className="h-8 w-8 border border-border/40 p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                  type="button"
                                  variant="ghost"
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    size={14}
                                  />
                                  <span className="sr-only">Delete</span>
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
