import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Comment01Icon,
  File01Icon,
  Mail01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireClientSession } from "@/auth/guards";
import { ProjectStatusPieChart } from "@/components/common/product-charts";
import { MetricLedger } from "@/components/common/product-ui";
import { PortalProjectDetailPendingPage } from "@/components/common/route-pending";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import { ProjectCollaborationPanel } from "@/components/projects/project-collaboration-panel";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import { ProjectMilestonesPanel } from "@/components/projects/project-milestones-panel";
import { ProjectUpdatesPanel } from "@/components/projects/project-updates-panel";
import {
  ensureClientsData,
  ensureProjectsData,
  ensureUsersData,
  useClientsData,
  useProjectMilestonesData,
  useProjectsData,
  useProjectUpdatesData,
  useUsersData,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import {
  findProjectByClientAndProjectPathParams,
  findProjectByPathParam,
} from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/projects/$id")({
  beforeLoad: requireClientSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
      ensureUsersData(context.queryClient),
    ]),
  pendingComponent: PortalProjectDetailPendingPage,
  component: LegacyPortalProjectDetailRoute,
});

function LegacyPortalProjectDetailRoute() {
  const { id } = Route.useParams();

  return <PortalProjectDetailPage projectSlug={id} />;
}

function PortalOverviewCard({
  description,
  progressPercentage,
}: {
  description: string | null;
  progressPercentage: number;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-card p-6 shadow-none transition-all duration-300 hover:border-primary/30">
      <div className="flex items-center justify-between border-border/40 border-b pb-3">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-tight">
          Project Overview
        </h2>
        <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
          Interactive Dossier
        </span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description || "No project overview description provided."}
      </p>
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider">
            Milestone Velocity
          </span>
          <span className="font-bold text-primary">{progressPercentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PremiumDeadlineCard({ deadline }: { deadline: string }) {
  const targetDate = new Date(deadline);
  const isInvalidDate = Number.isNaN(targetDate.getTime());

  let daysRemaining: number | null = null;
  if (!isInvalidDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="flex min-h-[220px] flex-col justify-between rounded-xl border border-border/50 bg-card p-5 shadow-none transition-all duration-300 hover:border-primary/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-border/40 border-b pb-3">
          <span className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
            Milestones Deadline
          </span>
          <HugeiconsIcon
            className="h-4.5 w-4.5 text-primary"
            icon={Calendar01Icon}
          />
        </div>
        <div className="flex items-center gap-2.5 font-bold text-[#08361f] text-lg tracking-tight dark:text-foreground">
          <span>{getDeadlineLabel(deadline)}</span>
        </div>
        <div className="text-muted-foreground text-xs">
          Target Date:{" "}
          <span className="font-medium text-foreground">
            {deadline || "None"}
          </span>
        </div>
      </div>

      <div className="mt-auto border-border/30 border-t pt-4">
        {daysRemaining === null ? (
          <span className="text-muted-foreground text-xs italic">
            No timeline targets active.
          </span>
        ) : daysRemaining > 0 ? (
          <div className="flex items-center gap-2 font-semibold text-primary text-xs">
            <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
            <span>
              {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left to
              deliver
            </span>
          </div>
        ) : daysRemaining === 0 ? (
          <div className="flex animate-pulse items-center gap-2 font-semibold text-amber-600 text-xs dark:text-amber-400">
            <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
            <span>Deliverable due today</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-semibold text-emerald-600 text-xs dark:text-emerald-400">
            <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
            <span>Deadline passed / Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimarySuccessTeamWidget() {
  const usersQuery = useUsersData();
  const users = usersQuery.data ?? [];
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-card p-5 shadow-none transition-all duration-300 hover:border-primary/30">
      <div className="flex items-center justify-between border-border/40 border-b pb-3">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-tight">
          Success Team
        </h2>
        <HugeiconsIcon
          className="h-4.5 w-4.5 text-primary"
          icon={UserGroupIcon}
        />
      </div>

      {usersQuery.isLoading ? (
        <div className="animate-pulse space-y-3 py-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      ) : admins.length === 0 ? (
        <p className="py-2 text-muted-foreground text-xs italic">
          No success team members assigned.
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {admins.slice(0, 2).map((admin) => (
            <div
              className="group/item flex items-center justify-between gap-3 border-border/20 border-b pb-3 last:border-0 last:pb-0"
              key={admin.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                {admin.image ? (
                  <img
                    alt={admin.name}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-primary/5"
                    src={admin.image}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 font-bold text-sm text-white shadow-sm">
                    {admin.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <h4 className="truncate font-bold text-foreground text-xs leading-none transition-colors duration-200 group-hover/item:text-primary">
                    {admin.name}
                  </h4>
                  <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                    Agency Expert
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <a
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                  href={`mailto:${admin.email}`}
                  title="Send Email"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PortalProjectDetailPage({
  clientSlug,
  projectSlug,
}: {
  clientSlug?: string;
  projectSlug: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "milestones" | "discussions" | "files" | "updates"
  >("overview");

  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

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
      <PortalShell>
        <LoadingPanel />
      </PortalShell>
    );
  }

  if (projectsQuery.error || clientsQuery.error) {
    return (
      <PortalShell>
        <ErrorPanel
          description={projectsQuery.error ?? clientsQuery.error ?? undefined}
        />
      </PortalShell>
    );
  }

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
      label: "Committed Investment",
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
    <PortalShell>
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
              Client Portal Project Dossier
            </p>
          </div>
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
          <div className="min-h-[350px] animate-slide-up-fade">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Project Overview */}
                <PortalOverviewCard
                  description={project.description}
                  progressPercentage={progressPercentage}
                />

                {/* Side-by-side Visual Analytics section */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col rounded-xl border border-border/50 bg-card p-5 shadow-none transition-all duration-300 hover:border-primary/30">
                    <h3 className="mb-4 border-border/40 border-b pb-2 font-bold text-foreground text-xs uppercase tracking-wider">
                      Milestone Status Shape
                    </h3>
                    <div className="relative flex min-h-[220px] flex-1 items-center justify-center">
                      <ProjectStatusPieChart
                        data={pieData}
                        isLoading={milestonesQuery.isLoading}
                      />
                    </div>
                  </div>

                  <PremiumDeadlineCard deadline={project.deadline} />
                </div>
              </div>
            )}

            {activeTab === "milestones" && (
              <ProjectMilestonesPanel
                canManage={false}
                projectId={project.id}
              />
            )}

            {activeTab === "discussions" && (
              <ProjectCollaborationPanel projectId={project.id} />
            )}

            {activeTab === "files" && (
              <ProjectFilesPanel canDelete={false} projectId={project.id} />
            )}

            {activeTab === "updates" && (
              <ProjectUpdatesPanel canManage={false} projectId={project.id} />
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Primary Success Team */}
          <PrimarySuccessTeamWidget />
        </div>
      </div>
    </PortalShell>
  );
}
