import {
  ArrowLeft01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Comment01Icon,
  Delete02Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  DeleteProjectDialog,
  ProjectFormDialog,
} from "@/components/admin/crud-dialogs";
import { ProjectStatusPieChart } from "@/components/common/product-charts";
import { MetricLedger, PageHeader } from "@/components/common/product-ui";
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
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import {
  ensureClientsData,
  ensureProjectsData,
  type ProjectMilestone,
  useClientsData,
  useProjectMilestonesData,
  useProjectsData,
  useProjectUpdatesData,
  useUpdateProjectMutation,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import {
  findProjectByClientAndProjectPathParams,
  findProjectByPathParam,
  getProjectPathParams,
} from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

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

function getProgressPercentage(
  totalMilestones: number,
  completedMilestones: number,
  status: string
): number {
  if (totalMilestones > 0) {
    return Math.round((completedMilestones / totalMilestones) * 100);
  }
  if (status === "completed") {
    return 100;
  }
  if (status === "in_progress") {
    return 60;
  }
  return 20;
}

function getPulseColor(pulseStatus: string): string {
  if (pulseStatus === "at_risk") {
    return "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400";
  }
  if (pulseStatus === "blocked") {
    return "text-rose-700 bg-rose-500/10 border-rose-500/20 dark:text-rose-400";
  }
  return "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
}

function getPulseStatus(
  latestUpdateStatus: string | undefined,
  projectStatus: string
): string {
  return (
    latestUpdateStatus ??
    (projectStatus === "completed" ? "complete" : "on_track")
  );
}

function ProjectDetailTabs({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<
    "milestones" | "discussions" | "files" | "updates"
  >("milestones");

  return (
    <>
      <div className="mb-2 flex flex-wrap gap-6 border-border/40 border-b pb-px">
        {[
          {
            id: "milestones",
            label: "Milestones",
            icon: CheckmarkCircle01Icon,
          },
          { id: "discussions", label: "Discussions", icon: Comment01Icon },
          { id: "files", label: "Files", icon: File01Icon },
          { id: "updates", label: "Updates", icon: Clock01Icon },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              className={cn(
                "flex select-none items-center gap-1.5 border-b-2 px-1 pt-1.5 pb-3 font-bold text-[11px] uppercase tracking-wider transition-all duration-250",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              )}
              key={tab.id}
              onClick={() =>
                setActiveTab(
                  tab.id as "milestones" | "discussions" | "files" | "updates"
                )
              }
              type="button"
            >
              <HugeiconsIcon className="h-3.5 w-3.5" icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-50 animate-slide-up-fade">
        {activeTab === "milestones" && (
          <ProjectMilestonesPanel canManage projectId={projectId} />
        )}

        {activeTab === "discussions" && (
          <ProjectCollaborationPanel projectId={projectId} />
        )}

        {activeTab === "files" && (
          <ProjectFilesPanel canDelete projectId={projectId} />
        )}

        {activeTab === "updates" && (
          <ProjectUpdatesPanel canManage projectId={projectId} />
        )}
      </div>
    </>
  );
}

interface ProjectDetailActionsProps {
  clientSlug?: string;
  clients: Client[];
  onStatusChange: (status: Project["status"]) => Promise<void>;
  project: Project;
  projectSlug: string;
  updateProjectPending: boolean;
}

function ProjectDetailActions({
  clients,
  clientSlug,
  projectSlug,
  project,
  updateProjectPending,
  onStatusChange,
}: ProjectDetailActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        disabled={updateProjectPending}
        items={PROJECT_STATUS_OPTIONS}
        onValueChange={(value) =>
          onStatusChange(value as Project["status"]).catch(() => undefined)
        }
        value={project.status}
      >
        <SelectTrigger className="w-36 transition-all duration-200" size="sm">
          {updateProjectPending ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Saving...
            </span>
          ) : (
            <SelectValue>{formatStatusLabel(project.status)}</SelectValue>
          )}
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
      <ProjectFormDialog
        clients={clients}
        onOpenChange={setIsEditOpen}
        onSaved={(updatedProject) => {
          const { clientSlug: nextClientSlug, projectSlug: nextProjectSlug } =
            getProjectPathParams(updatedProject, clients);

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
          <Button
            className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            size="sm"
            type="button"
            variant="outline"
          >
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
          <Button
            className="h-6 w-6 border border-border/40 p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95 bg-background"
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={Delete02Icon} size={11} strokeWidth={2.5} />
            <span className="sr-only">Delete</span>
          </Button>
        }
      />
    </div>
  );
}

function LegacyAdminProjectDetailRoute() {
  const { id } = Route.useParams();

  return <AdminProjectDetailPage projectSlug={id} />;
}

interface MilestoneAnalyticsWidgetProps {
  isLoading: boolean;
  milestones: ProjectMilestone[];
}

function MilestoneAnalyticsWidget({
  milestones,
  isLoading,
}: MilestoneAnalyticsWidgetProps) {
  if (milestones.length === 0) {
    return null;
  }

  const completedMilestones = milestones.filter(
    (m) => m.status === "done"
  ).length;
  const pieData = [
    { status: "Completed", total: completedMilestones },
    {
      status: "In Progress",
      total: milestones.filter((m) => m.status === "in_progress").length,
    },
    {
      status: "Planning",
      total: milestones.filter((m) => m.status === "todo").length,
    },
  ];

  return (
    <div className="group rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
      <span className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
        Milestone Status Shape
      </span>
      <div className="relative mt-3 flex h-70 w-full items-center justify-center">
        <ProjectStatusPieChart data={pieData} isLoading={isLoading} />
      </div>
    </div>
  );
}

export function AdminProjectDetailPage({
  clientSlug,
  projectSlug,
}: {
  clientSlug?: string;
  projectSlug: string;
}) {
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

  const milestonesQuery = useProjectMilestonesData(project?.id ?? "");
  const updatesQuery = useProjectUpdatesData(project?.id ?? "");

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

  async function handleStatusChange(status: Project["status"]) {
    if (!project) {
      return;
    }
    await updateProject.mutateAsync({
      id: project.id,
      input: {
        budget: project.budget,
        clientId: project.clientId,
        deadline: project.deadline,
        description: project.description,
        status,
        title: project.title,
      },
    });
  }

  const milestones = milestonesQuery.data ?? [];
  const completedMilestones = milestones.filter(
    (m) => m.status === "done"
  ).length;
  const totalMilestones = milestones.length;
  const progressPercentage = getProgressPercentage(
    totalMilestones,
    completedMilestones,
    project.status
  );

  const updates = updatesQuery.data ?? [];
  const latestUpdate = updates[0];
  const pulseStatus = getPulseStatus(latestUpdate?.status, project.status);
  const pulseColor = getPulseColor(pulseStatus);

  const ledgerItems = [
    {
      detail: "Committed project ledger budget",
      label: "Allocated Budget",
      value: `$${project.budget.toLocaleString()}`,
    },
    {
      detail: `${completedMilestones} of ${totalMilestones} deliverables completed`,
      label: "Milestone Velocity",
      value: `${progressPercentage}%`,
    },
    {
      detail: latestUpdate
        ? `Latest report: ${latestUpdate.title}`
        : "System tracking operational",
      label: "Project Pulse",
      value: (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 font-bold text-xs uppercase tracking-wider ${pulseColor}`}
        >
          {pulseStatus.replace("_", " ")}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          className="inline-flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground uppercase tracking-widest transition-colors hover:text-primary"
          to="/projects"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={11} strokeWidth={2.5} />
          Back to Projects
        </Link>
      </div>
      <PageHeader
        actions={
          <ProjectDetailActions
            clientSlug={clientSlug}
            clients={clients}
            onStatusChange={handleStatusChange}
            project={project}
            projectSlug={projectSlug}
            updateProjectPending={updateProject.isPending}
          />
        }
        avatar={
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-teal-800 font-bold text-white text-xl shadow-sm ring-4 ring-primary/10 transition-all duration-300 hover:scale-105">
            {project.title
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        }
        description={
          <div className="space-y-2">
            {project.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {project.description}
              </p>
            )}
            {project.deadline && (
              <div className="flex items-center gap-1.5 pt-0.5 font-semibold text-muted-foreground text-xs">
                <HugeiconsIcon
                  className="h-3.5 w-3.5 text-primary"
                  icon={Calendar01Icon}
                />
                <span>
                  Target Deadline: {getDeadlineLabel(project.deadline)}
                </span>
                <span className="font-normal text-[10px]">
                  ({project.deadline})
                </span>
              </div>
            )}
          </div>
        }
        eyebrow="Internal Project Ledger"
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>{project.title}</span>
            <StatusBadge value={project.status} />
          </div>
        }
      />

      {/* Metrics Ledger */}
      <div className="mb-6">
        <MetricLedger items={ledgerItems} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          <ProjectDetailTabs projectId={project.id} />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1 lg:mt-11.5">
          {/* Milestone Status Pie Chart Widget */}
          <MilestoneAnalyticsWidget
            isLoading={milestonesQuery.isLoading}
            milestones={milestones}
          />
        </div>
      </div>
    </AppShell>
  );
}
