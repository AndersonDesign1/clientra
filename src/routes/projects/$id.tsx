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
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  useReviewStatusChangeRequestMutation,
  useStatusChangeRequestsData,
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
  loader: async ({ context, params }) => {
    const [clients, projects] = await Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]);

    // Find the project by ID to get proper slugs for redirect
    const project = findProjectByPathParam(projects, params.id);
    if (!project) {
      throw new Error("Project not found");
    }

    const client = clients.find((c) => c.id === project.clientId);
    if (!client) {
      throw new Error("Client not found for project");
    }

    // Return redirect target
    const { clientSlug, projectSlug } = getProjectPathParams(project, clients);
    throw redirect({
      to: "/projects/$clientSlug/$projectSlug",
      params: {
        clientSlug,
        projectSlug,
      },
      replace: true,
    });
  },
  pendingComponent: ProjectDetailPendingPage,
  component: RedirectToModernProjectRoute,
  errorComponent: ProjectRouteError,
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
          onStatusChange(value as Project["status"]).catch((err) => {
            console.error("Failed to update project status:", err);
          })
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
          navigate({ to: "/projects" }).catch((err) => {
            console.error("Failed to navigate after project deletion:", err);
          });
        }}
        project={project}
        trigger={
          <Button
            className="h-6 w-6 border border-border/40 bg-background p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
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

function RedirectToModernProjectRoute() {
  return <ProjectDetailPendingPage />;
}

function ProjectRouteError({ error }: { error: Error }) {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-4">
        <ErrorPanel
          description={
            error?.message ?? "We couldn't find the project you're looking for."
          }
          title="Project Not Found"
        />
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/projects" }).catch(() => undefined)}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Projects
        </Button>
      </div>
    </AppShell>
  );
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
  const statusRequestsQuery = useStatusChangeRequestsData(project?.id ?? "");
  const reviewMutation = useReviewStatusChangeRequestMutation();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const statusRequests = statusRequestsQuery.data ?? [];
  const pendingStatusRequests = statusRequests.filter(
    (r) => r.approvalState === "pending"
  );
  const hasPendingRequest = pendingStatusRequests.length > 0;

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

  async function handleReviewRequest(
    requestId: string,
    approvalState: "approved" | "rejected"
  ) {
    if (!project) {
      return;
    }
    setNotification(null);
    try {
      await reviewMutation.mutateAsync({
        id: requestId,
        projectId: project.id,
        approvalState,
      });
      setNotification({
        type: "success",
        message: `Request ${approvalState === "approved" ? "approved" : "rejected"} successfully.`,
      });
    } catch (err) {
      console.error("Failed to review status change request:", err);
      setNotification({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to review status change request.",
      });
    }
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

      {notification && (
        <div
          className={`mb-6 rounded-xl border p-4 font-semibold text-xs shadow-[0_1px_3px_rgba(0,0,0,0.015)] ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50/10 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-400"
              : "border-rose-200 bg-rose-50/10 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/10 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{notification.message}</span>
            <button
              className="cursor-pointer font-bold text-[10px] uppercase hover:underline"
              onClick={() => setNotification(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Pending status change request banner */}
      {hasPendingRequest &&
        pendingStatusRequests.map((pendingReq) => (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200/50 bg-amber-50/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.015)] dark:border-amber-900/50 dark:bg-amber-950/10"
            key={pendingReq.id}
          >
            <div className="space-y-1">
              <h4 className="font-semibold text-amber-700 text-xs dark:text-amber-400">
                Pending Status Change Request
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Client requested to change status from{" "}
                <span className="font-bold">
                  {formatStatusLabel(project.status)}
                </span>{" "}
                to{" "}
                <span className="font-bold">
                  {formatStatusLabel(pendingReq.requestedStatus)}
                </span>
                .
              </p>
              {pendingReq.reason && (
                <p className="mt-1 text-muted-foreground text-xs italic">
                  "{pendingReq.reason}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-emerald-600 font-semibold text-white text-xs hover:bg-emerald-700"
                disabled={reviewMutation.isPending}
                onClick={() => handleReviewRequest(pendingReq.id, "approved")}
                size="sm"
              >
                Approve
              </Button>
              <Button
                className="border-rose-200 font-semibold text-rose-600 text-xs hover:bg-rose-50/50 hover:text-rose-700"
                disabled={reviewMutation.isPending}
                onClick={() => handleReviewRequest(pendingReq.id, "rejected")}
                size="sm"
                variant="outline"
              >
                Reject
              </Button>
            </div>
          </div>
        ))}

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
