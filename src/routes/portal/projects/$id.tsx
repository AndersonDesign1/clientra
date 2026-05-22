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
import { type FormEvent, useState } from "react";
import { requireClientSession } from "@/auth/guards";
import { PortalProjectDetailPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import { ProjectFilesPanel } from "@/components/projects/project-files-panel";
import { ProjectMilestonesPanel } from "@/components/projects/project-milestones-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureClientsData,
  ensureProjectsData,
  ensureUsersData,
  type Project,
  type ProjectMilestone,
  type ProjectUpdate,
  useClientsData,
  useCreateProjectCommentMutation,
  useProjectCollaborationData,
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

function getDeadlineStatusElement(daysRemaining: number | null) {
  if (daysRemaining === null) {
    return (
      <span className="text-muted-foreground text-xs italic">
        No timeline targets active.
      </span>
    );
  }
  if (daysRemaining > 0) {
    return (
      <div className="flex items-center gap-2 font-semibold text-primary text-xs">
        <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
        <span>
          {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left to deliver
        </span>
      </div>
    );
  }
  if (daysRemaining === 0) {
    return (
      <div className="flex animate-pulse items-center gap-2 font-semibold text-amber-600 text-xs dark:text-amber-400">
        <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
        <span>Deliverable due today</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 font-semibold text-emerald-600 text-xs dark:text-emerald-400">
      <HugeiconsIcon className="h-3.5 w-3.5" icon={Clock01Icon} />
      <span>Deadline passed / Completed</span>
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
    <div className="flex min-h-[200px] flex-col justify-between rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
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

      <div className="mt-auto border-border/40 border-t pt-4">
        {getDeadlineStatusElement(daysRemaining)}
      </div>
    </div>
  );
}

function PrimarySuccessTeamWidget() {
  const usersQuery = useUsersData();
  const users = usersQuery.data ?? [];
  const admins = users.filter((u) => u.role === "admin");

  const renderContent = () => {
    if (usersQuery.isLoading) {
      return (
        <div className="animate-pulse space-y-3 py-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      );
    }
    if (admins.length === 0) {
      return (
        <p className="py-2 text-muted-foreground text-xs italic">
          No success team members assigned.
        </p>
      );
    }
    return (
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
                  height={40}
                  src={admin.image}
                  width={40}
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
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-border/40 border-b pb-3">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-tight">
          Success Team
        </h2>
        <HugeiconsIcon
          className="h-4.5 w-4.5 text-primary"
          icon={UserGroupIcon}
        />
      </div>
      {renderContent()}
    </div>
  );
}

function getUpdateStatusBadgeStyles(status: string) {
  if (status === "on_track" || status === "complete") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
  if (status === "at_risk") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
  if (status === "blocked") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
  }
  return "bg-secondary/40 text-muted-foreground border-border/40";
}

function getStatusAccentStyles(status: string) {
  switch (status) {
    case "on_track":
    case "complete":
      return "border-l-4 border-emerald-600 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]";
    case "at_risk":
      return "border-l-4 border-amber-500 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]";
    case "blocked":
      return "border-l-4 border-rose-500 bg-rose-500/[0.02] dark:bg-rose-500/[0.01]";
    default:
      return "border-l-4 border-border bg-secondary/[0.01]";
  }
}

function formatProjectUpdateStatus(status: string) {
  if (status === "on_track") {
    return "On track";
  }
  if (status === "at_risk") {
    return "At risk";
  }
  if (status === "blocked") {
    return "Blocked";
  }
  if (status === "complete") {
    return "Complete";
  }
  return "Update";
}

function UnifiedActivityPanel({ projectId }: { projectId: string }) {
  const collaborationQuery = useProjectCollaborationData(projectId);
  const updatesQuery = useProjectUpdatesData(projectId);
  const createCommentMutation = useCreateProjectCommentMutation();
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setFormError("Write a message before sending.");
      return;
    }
    setFormError(null);
    try {
      await createCommentMutation.mutateAsync({
        content: trimmed,
        projectId,
      });
      setContent("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to send message right now."
      );
    }
  }

  if (
    (collaborationQuery.isLoading && !collaborationQuery.data) ||
    (updatesQuery.isLoading && !updatesQuery.data)
  ) {
    return (
      <div className="py-4">
        <LoadingPanel
          description="Loading activity history..."
          title="Loading Activity"
        />
      </div>
    );
  }

  if (collaborationQuery.error || updatesQuery.error) {
    return (
      <ErrorPanel
        description={
          (collaborationQuery.error as string) ??
          (updatesQuery.error as string) ??
          "Failed to load activity."
        }
      />
    );
  }

  const comments = collaborationQuery.data?.comments ?? [];
  const updates = updatesQuery.data ?? [];

  interface UnifiedComment {
    createdAt: string;
    data: (typeof comments)[0];
    id: string;
    type: "comment";
  }

  interface UnifiedUpdate {
    createdAt: string;
    data: (typeof updates)[0];
    id: string;
    type: "update";
  }

  type UnifiedActivityItem = UnifiedComment | UnifiedUpdate;

  const items: UnifiedActivityItem[] = [
    ...comments.map((c) => ({
      type: "comment" as const,
      id: c.id,
      createdAt: c.createdAt,
      data: c,
    })),
    ...updates.map((u) => ({
      type: "update" as const,
      id: u.id,
      createdAt: u.createdAt,
      data: u,
    })),
  ];

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Activity Intro */}
      <div className="border-border/40 border-b pb-4">
        <h2 className="font-semibold text-base text-foreground">
          Project Activity
        </h2>
        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
          Review formal status reports and team discussions in a single unified
          timeline.
        </p>
      </div>

      {/* Message Composer */}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          className="min-h-[96px] w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Send a message or ask a question..."
          value={content}
        />
        {formError && (
          <div className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-2.5 text-rose-700 text-xs">
            {formError}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground/75 italic">
            Plain-text messages only
          </p>
          <Button
            disabled={createCommentMutation.isPending}
            size="sm"
            type="submit"
          >
            {createCommentMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </form>

      {/* Stream */}
      <div className="space-y-4 border-border/20 border-t pt-6">
        {items.length === 0 ? (
          <EmptyPanel
            description="The activity log is currently quiet. Post a message to get started."
            title="No activity yet"
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              if (item.type === "comment") {
                const comment = item.data;
                const isAdmin = comment.authorRole?.toLowerCase() === "admin";
                const initials = comment.authorName
                  ? comment.authorName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                return (
                  <article
                    className="flex animate-slide-up-fade items-start gap-3.5 rounded-xl border border-border/40 bg-card p-4 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    key={comment.id}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] text-white shadow-sm",
                        isAdmin
                          ? "bg-gradient-to-br from-emerald-600 to-teal-800"
                          : "bg-gradient-to-br from-blue-600 to-sky-700"
                      )}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#08361f] text-xs dark:text-foreground">
                            {comment.authorName}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
                              isAdmin
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            )}
                          >
                            {comment.authorRole}
                          </span>
                        </div>
                        <span className="font-medium text-[9px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString(
                            undefined,
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </article>
                );
              }
              const update = item.data;
              return (
                <article
                  className={cn(
                    "animate-slide-up-fade rounded-xl border border-border/40 p-4 transition-all duration-300 hover:border-primary/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
                    getStatusAccentStyles(update.status)
                  )}
                  key={update.id}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#08361f] text-xs leading-tight dark:text-foreground">
                            {update.title}
                          </span>
                          <Badge
                            className={cn(
                              "rounded px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
                              getUpdateStatusBadgeStyles(update.status)
                            )}
                            variant={null}
                          >
                            {formatProjectUpdateStatus(update.status)}
                          </Badge>
                        </div>
                        <p className="font-semibold text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                          Official Report by {update.authorName}
                        </p>
                      </div>
                      <span className="font-semibold text-[9px] text-muted-foreground">
                        {new Date(update.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
                      {update.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProjectPortalHeaderProps {
  milestones: ProjectMilestone[];
  project: Project;
  updates: ProjectUpdate[];
}

function ProjectPortalHeader({
  project,
  milestones,
  updates,
}: ProjectPortalHeaderProps) {
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

  return (
    <div className="mb-6 rounded-2xl border border-border/40 bg-secondary/15 p-6 shadow-none">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
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

      {/* Unified Grid: Statement & Metrics */}
      <div className="mt-6 grid gap-6 border-border/25 border-t pt-6 md:grid-cols-3">
        {/* Statement */}
        <div className="space-y-2 md:col-span-2">
          <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
            Project Statement
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {project.description || "No project overview description provided."}
          </p>
        </div>

        {/* Velocity & Overview */}
        <div className="space-y-4">
          {/* Milestone Velocity */}
          <div className="space-y-2.5 rounded-xl border border-border/40 bg-card/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground uppercase tracking-wider">
                Milestone Velocity
              </span>
              <span className="font-extrabold text-primary">
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/85">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="block text-[10px] text-muted-foreground leading-none">
              {completedMilestones} of {totalMilestones} deliverables completed
            </span>
          </div>

          {/* Investment & Pulse */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/60 p-4">
            <div>
              <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Investment
              </span>
              <span className="font-extrabold text-foreground text-sm">
                ${project.budget.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Pulse
              </span>
              <span
                className={`mt-0.5 inline-flex items-center rounded-md border px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider ${pulseColor}`}
              >
                {pulseStatus.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>
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
    "activity" | "milestones" | "files"
  >("activity");

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
          description={
            (projectsQuery.error as string) ??
            (clientsQuery.error as string) ??
            undefined
          }
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

  return (
    <PortalShell>
      <ProjectPortalHeader
        milestones={milestonesQuery.data ?? []}
        project={project}
        updates={updatesQuery.data ?? []}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dynamic Tab Bar */}
          <div className="mb-2 flex flex-wrap gap-6 border-border/40 border-b pb-px">
            {[
              { id: "activity", label: "Activity", icon: Comment01Icon },
              {
                id: "milestones",
                label: "Milestones",
                icon: CheckmarkCircle01Icon,
              },
              { id: "files", label: "Files", icon: File01Icon },
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
                    setActiveTab(tab.id as "activity" | "milestones" | "files")
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
            {activeTab === "activity" && (
              <UnifiedActivityPanel projectId={project.id} />
            )}

            {activeTab === "milestones" && (
              <ProjectMilestonesPanel
                canManage={false}
                projectId={project.id}
              />
            )}

            {activeTab === "files" && (
              <ProjectFilesPanel canDelete={false} projectId={project.id} />
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Milestones Deadline */}
          <PremiumDeadlineCard deadline={project.deadline} />
          {/* Primary Success Team */}
          <PrimarySuccessTeamWidget />
        </div>
      </div>
    </PortalShell>
  );
}
