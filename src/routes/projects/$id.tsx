import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Comment01Icon,
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
import { MetricLedger } from "@/components/common/product-ui";
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
  useClientsData,
  useProjectMilestonesData,
  useProjectsData,
  useProjectUpdatesData,
  useUpdateProjectMutation,
} from "@/lib/api";
import { getClientPathParam } from "@/lib/client-slugs";
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

function LegacyAdminProjectDetailRoute() {
  const { id } = Route.useParams();

  return <AdminProjectDetailPage projectSlug={id} />;
}

const WHITESPACE_REGEX = /\s+/;

function getInitials(name: string) {
  const parts = name.split(WHITESPACE_REGEX).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts.at(-1)?.[0]).toUpperCase();
}


interface ParentClientWidgetProps {
  client: Client;
}

function ParentClientWidget({ client }: ParentClientWidgetProps) {
  return (
    <div className="group rounded-xl border border-border/50 bg-card/30 p-5 shadow-none transition-all duration-300 hover:border-primary/30 hover:bg-card/70 hover:shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
      <span className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
        Parent Client
      </span>
      <div className="mt-3.5 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 font-bold text-sm text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-primary/10">
          {getInitials(client.name)}
        </div>
        <div className="min-w-0">
          <Link
            className="block truncate font-bold text-[#08361f] text-sm leading-tight transition-colors duration-200 hover:text-primary dark:text-foreground dark:hover:text-primary"
            params={{ id: getClientPathParam(client) }}
            to="/clients/$id"
          >
            {client.name}
          </Link>
          <span className="mt-0.5 block truncate font-semibold text-muted-foreground text-xs">
            {client.company}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-border/40 border-t pt-3 text-[11px] text-muted-foreground">
        <span className="truncate pr-2">{client.email}</span>
        <Link
          className="shrink-0 font-semibold text-primary transition-colors hover:underline"
          params={{ id: getClientPathParam(client) }}
          to="/clients/$id"
        >
          Dossier →
        </Link>
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
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<{
    projectId: string;
    status: Project["status"];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "milestones" | "discussions" | "files" | "updates"
  >("overview");

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

  const client = clients.find((c) => c.id === project.clientId);

  const milestones = milestonesQuery.data ?? [];
  const completedMilestones = milestones.filter(
    (m) => m.status === "done"
  ).length;
  const totalMilestones = milestones.length;
  let progressPercentage = 0;
  if (totalMilestones > 0) {
    progressPercentage = Math.round(
      (completedMilestones / totalMilestones) * 100
    );
  } else if (project.status === "completed") {
    progressPercentage = 100;
  } else if (project.status === "in_progress") {
    progressPercentage = 60;
  } else {
    progressPercentage = 20; // planning
  }

  const updates = updatesQuery.data ?? [];
  const latestUpdate = updates[0];
  const pulseStatus =
    latestUpdate?.status ??
    (project.status === "completed" ? "complete" : "on_track");

  let pulseColor = "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
  if (pulseStatus === "at_risk") {
    pulseColor =
      "text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400";
  } else if (pulseStatus === "blocked") {
    pulseColor =
      "text-rose-700 bg-rose-500/10 border-rose-500/20 dark:text-rose-400";
  }

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
      ) as any,
    },
  ];

  return (
    <AppShell>
      {/* Identity Header */}
      <div className="mb-6 flex flex-col gap-6 border-border/50 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 font-bold text-white text-xl shadow-sm ring-4 ring-primary/10">
            {project.title
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-extrabold text-2xl text-[#08361f] tracking-tight dark:text-foreground">
                {project.title}
              </h1>
              <StatusBadge value={project.status} />
            </div>
            <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Internal Project Ledger
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
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
              <SelectValue>{formatStatusLabel(currentStatusDraft)}</SelectValue>
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
        </div>
      </div>

      {/* Metrics Ledger */}
      <div className="mb-6">
        <MetricLedger items={ledgerItems} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dynamic Tab Bar */}
          <div className="mb-2 flex flex-wrap gap-6 border-border/40 border-b pb-px">
            {[
              { id: "overview", label: "Overview", icon: Calendar01Icon },
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
                      tab.id as
                        | "overview"
                        | "milestones"
                        | "discussions"
                        | "files"
                        | "updates"
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

          {/* Active Tab Panel */}
          <div className="min-h-[200px] animate-slide-up-fade">
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Compact overview: description + progress + deadline */}
                <div className="space-y-3 border-border/25 border-b pb-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {project.description || "No project overview description provided."}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                        Milestone Velocity
                      </span>
                      <span className="font-bold text-primary">{progressPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon className="h-3.5 w-3.5 text-primary" icon={Calendar01Icon} />
                      <span className="font-semibold">{getDeadlineLabel(project.deadline)}</span>
                      {project.deadline ? (
                        <span className="text-[10px]">· {project.deadline}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon className="h-3.5 w-3.5" icon={CheckmarkCircle01Icon} />
                      <span className="font-semibold">{completedMilestones}/{totalMilestones} milestones done</span>
                    </div>
                  </div>
                </div>

                {/* Milestone status chart — inline, no card box */}
                <div>
                  <h3 className="mb-2 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                    Milestone Status Shape
                  </h3>
                  <div className="relative flex h-[180px] w-full items-center justify-center">
                    <ProjectStatusPieChart
                      data={pieData}
                      isLoading={milestonesQuery.isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "milestones" && (
              <ProjectMilestonesPanel canManage projectId={project.id} />
            )}

            {activeTab === "discussions" && (
              <ProjectCollaborationPanel projectId={project.id} />
            )}

            {activeTab === "files" && (
              <ProjectFilesPanel canDelete projectId={project.id} />
            )}

            {activeTab === "updates" && (
              <ProjectUpdatesPanel canManage projectId={project.id} />
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Parent Client Widget */}
          {client ? <ParentClientWidget client={client} /> : null}
        </div>
      </div>
    </AppShell>
  );
}
