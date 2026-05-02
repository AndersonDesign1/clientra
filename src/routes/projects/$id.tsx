import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  DeleteProjectDialog,
  ProjectFormDialog,
} from "@/components/admin/crud-dialogs";
import {
  DataSection,
  DefinitionGrid,
  PageHeader,
} from "@/components/common/product-ui";
import { ProjectDetailPendingPage } from "@/components/common/route-pending";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import {
  formatStatusLabel,
  StatusBadge,
} from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectCollaborationPanel } from "@/components/projects/project-collaboration-panel";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import { ProjectMilestonesPanel } from "@/components/projects/project-milestones-panel";
import { ProjectUpdatesPanel } from "@/components/projects/project-updates-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/features/projects/mock-data";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
  useUpdateProjectMutation,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import {
  findProjectByClientAndProjectPathParams,
  findProjectByPathParam,
  getProjectPathParams,
} from "@/lib/project-slugs";

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: ProjectDetailPendingPage,
  component: LegacyAdminProjectDetailRoute,
});

const PROJECT_STATUS_OPTIONS = [
  { label: "Planning", value: "planning" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
] as const;

function LegacyAdminProjectDetailRoute() {
  const { id } = Route.useParams();

  return <AdminProjectDetailPage projectSlug={id} />;
}

export function AdminProjectDetailPage({
  clientSlug,
  projectSlug,
}: {
  clientSlug?: string;
  projectSlug: string;
}) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<{
    projectId: string;
    status: Project["status"];
  } | null>(null);
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();
  const updateProject = useUpdateProjectMutation();
  const clients = clientsQuery.data ?? [];
  const project = clientSlug
    ? findProjectByClientAndProjectPathParams({
        clients,
        clientSlug,
        projects: projectsQuery.data ?? [],
        projectSlug,
      })
    : findProjectByPathParam(projectsQuery.data ?? [], projectSlug);

  if (projectsQuery.isLoading || clientsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingPanel />
      </AppShell>
    );
  }

  if (projectsQuery.error || clientsQuery.error) {
    return (
      <AppShell>
        <ErrorPanel
          description={
            projectsQuery.error ||
            clientsQuery.error ||
            "We couldn't load this project."
          }
        />
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <ErrorPanel
          description="We could not find a project with that id."
          title="Project not found"
        />
      </AppShell>
    );
  }

  const selectedProject = project;
  const currentStatusDraft =
    statusDraft?.projectId === selectedProject.id
      ? statusDraft.status
      : selectedProject.status;
  const hasStatusChange = currentStatusDraft !== selectedProject.status;

  async function saveStatus() {
    await updateProject.mutateAsync({
      id: selectedProject.id,
      input: {
        budget: selectedProject.budget,
        clientId: selectedProject.clientId,
        deadline: selectedProject.deadline,
        description: selectedProject.description,
        status: currentStatusDraft,
        title: selectedProject.title,
      },
    });
    setStatusDraft(null);
  }

  return (
    <AppShell>
      <PageHeader
        actions={
          <>
            <StatusBadge value={project.status} />
            <Select
              items={PROJECT_STATUS_OPTIONS}
              onValueChange={(value) =>
                setStatusDraft({
                  projectId: selectedProject.id,
                  status: value as Project["status"],
                })
              }
              value={currentStatusDraft}
            >
              <SelectTrigger className="w-36" size="sm">
                <SelectValue>
                  {formatStatusLabel(currentStatusDraft)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              disabled={!hasStatusChange || updateProject.isPending}
              onClick={() => {
                saveStatus().catch(() => undefined);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {updateProject.isPending ? "Saving..." : "Save status"}
            </Button>
            <ProjectFormDialog
              clients={clients}
              onOpenChange={setIsEditOpen}
              onSaved={(updatedProject) => {
                const {
                  clientSlug: nextClientSlug,
                  projectSlug: nextProjectSlug,
                } = getProjectPathParams(updatedProject, clients);

                if (
                  nextClientSlug !== clientSlug ||
                  nextProjectSlug !== projectSlug
                ) {
                  navigate({
                    params: {
                      clientSlug: nextClientSlug,
                      projectSlug: nextProjectSlug,
                    },
                    replace: true,
                    to: "/projects/$clientSlug/$projectSlug",
                  }).catch(() => undefined);
                }
              }}
              open={isEditOpen}
              project={project}
              trigger={
                <Button size="sm" type="button" variant="outline">
                  Edit
                </Button>
              }
            />
            <DeleteProjectDialog
              onDeleted={() => {
                navigate({ to: "/projects" }).catch(() => undefined);
              }}
              project={project}
              trigger={
                <Button size="sm" type="button" variant="destructive">
                  Delete
                </Button>
              }
            />
          </>
        }
        description={project.description}
        title={project.title}
      />
      <DataSection title="Project record">
        <DefinitionGrid
          items={[
            {
              label: "Budget",
              value: `$${project.budget.toLocaleString()}`,
            },
            { label: "Deadline", value: getDeadlineLabel(project.deadline) },
            { label: "Status", value: formatStatusLabel(project.status) },
            { label: "Project ID", value: project.id },
          ]}
        />
      </DataSection>
      <DataSection title="Updates">
        <ProjectUpdatesPanel canManage projectId={project.id} />
      </DataSection>
      <DataSection title="Milestones">
        <ProjectMilestonesPanel canManage projectId={project.id} />
      </DataSection>
      <DataSection title="Collaboration">
        <ProjectCollaborationPanel projectId={project.id} />
      </DataSection>
      <DataSection title="Files">
        <ProjectFilesPanel canDelete projectId={project.id} />
      </DataSection>
    </AppShell>
  );
}
