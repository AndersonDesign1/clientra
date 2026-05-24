import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { ProjectFormDialog } from "@/components/admin/crud-dialogs";
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
import { AppShell } from "@/components/layout/app-shell";
import { ProjectRegisterTable } from "@/components/projects/project-register-table";
import { Button } from "@/components/ui/button";
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
  getProjectStatusData,
} from "@/lib/insights";

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
  const projects = projectsQuery.data ?? [];

  const isLoading = projectsQuery.isLoading || clientsQuery.isLoading;
  const error = projectsQuery.error ?? clientsQuery.error;

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
      {isLoading && <LoadingPanel />}
      {!isLoading && error && <ErrorPanel description={error} />}
      {!(isLoading || error) && projects.length === 0 && (
        <EmptyPanel
          description="Create your first project once a client is available."
          title="No projects yet"
        />
      )}
      {!(isLoading || error) && projects.length > 0 && (
        <>
          <DataSection title="Delivery shape">
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Project Status
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <ProjectStatusPieChart
                    data={getProjectStatusData(projects)}
                  />
                </div>
              </div>
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Deadlines
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <DeadlineAreaChart data={getDeadlineData(projects)} />
                </div>
              </div>
              <div className="group flex flex-col rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
                <div className="border-border/40 border-b pb-3 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                  Budget by Status
                </div>
                <div className="flex w-full flex-1 items-center justify-center pt-4">
                  <BudgetComposedChart data={getBudgetByStatusData(projects)} />
                </div>
              </div>
            </div>
          </DataSection>
          <DataSection title="Project register">
            <ProjectRegisterTable
              clients={clients}
              onEdit={setEditingProject}
              projects={projects}
              showActions={true}
            />
          </DataSection>
        </>
      )}
      {editingProject && (
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
      )}
    </AppShell>
  );
}
