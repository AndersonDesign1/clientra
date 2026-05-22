import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Comment01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/common/status-badge";
import {
  useProjectCollaborationData,
  useProjectFilesData,
  useProjectMilestonesData,
  useProjectUpdatesData,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface EnhancedProjectCardProps {
  className?: string;
  clientSlug: string;
  delayMs?: number;
  isPortal?: boolean;
  project: {
    id: string;
    title: string;
    description: string | null;
    budget: number;
    deadline: string | null;
    status: "planning" | "in_progress" | "completed";
  };
  projectSlug: string;
}

export function EnhancedProjectCard({
  project,
  clientSlug,
  projectSlug,
  isPortal = false,
  className,
  delayMs = 0,
}: EnhancedProjectCardProps) {
  // Parallel asynchronous queries for project metadata
  const milestonesQuery = useProjectMilestonesData(project.id);
  const filesQuery = useProjectFilesData(project.id);
  const updatesQuery = useProjectUpdatesData(project.id);
  const collaborationQuery = useProjectCollaborationData(project.id);

  const milestones = milestonesQuery.data ?? [];
  const filesCount = filesQuery.data?.length ?? 0;
  const updatesCount = updatesQuery.data?.length ?? 0;
  const commentsCount = collaborationQuery.data?.comments.length ?? 0;

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

  let progressColor = "bg-amber-500";
  if (progressPercentage === 100) {
    progressColor = "bg-emerald-600";
  } else if (progressPercentage >= 50) {
    progressColor = "bg-primary";
  }

  return (
    <div
      className={cn(
        "group flex animate-slide-up-fade flex-col justify-between gap-5 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="space-y-3.5">
        {/* Title and Status Header */}
        <div className="flex items-start justify-between gap-3">
          {isPortal ? (
            <Link
              className="line-clamp-1 flex-1 font-bold text-brand-heading text-base leading-snug transition-colors duration-200 hover:text-primary"
              params={{ clientSlug, projectSlug }}
              to="/portal/projects/$clientSlug/$projectSlug"
            >
              {project.title}
            </Link>
          ) : (
            <Link
              className="line-clamp-1 flex-1 font-bold text-brand-heading text-base leading-snug transition-colors duration-200 hover:text-primary"
              params={{ clientSlug, projectSlug }}
              to="/projects/$clientSlug/$projectSlug"
            >
              {project.title}
            </Link>
          )}
          <StatusBadge value={project.status} />
        </div>

        {/* Project Description */}
        {project.description ? (
          <p className="line-clamp-2 text-muted-foreground/90 text-xs leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-xs italic">
            No project description provided.
          </p>
        )}
      </div>

      <div className="space-y-4 pt-1">
        {/* Milestone Completion Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">
              Milestone Velocity
            </span>
            {milestonesQuery.isLoading ? (
              <span className="h-3 w-8 animate-pulse rounded bg-muted" />
            ) : (
              <span className="font-bold text-foreground">
                {progressPercentage}% ({completedMilestones}/{totalMilestones})
              </span>
            )}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                progressColor
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tactile Metadata Indicators */}
        <div className="flex flex-wrap items-center gap-2 border-border/20 border-t pt-3">
          {[
            {
              count: commentsCount,
              label: "comment",
              icon: Comment01Icon,
              loading: collaborationQuery.isLoading,
              color: "text-primary border-primary/10 bg-primary/5",
            },
            {
              count: filesCount,
              label: "file",
              icon: File01Icon,
              loading: filesQuery.isLoading,
              color:
                "text-amber-600 border-amber-500/10 bg-amber-500/5 dark:text-amber-400",
            },
            {
              count: updatesCount,
              label: "update",
              icon: CheckmarkCircle01Icon,
              loading: updatesQuery.isLoading,
              color:
                "text-blue-600 border-blue-500/10 bg-blue-500/5 dark:text-blue-400",
            },
          ].map((meta) => (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider transition-all duration-200",
                meta.loading
                  ? "animate-pulse border-border bg-muted"
                  : meta.color
              )}
              key={meta.label}
            >
              {meta.loading ? (
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              ) : (
                <>
                  <HugeiconsIcon className="h-3 w-3" icon={meta.icon} />
                  <span>
                    {meta.count} {meta.label}
                    {meta.count === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer Budget & Deadline Ledger */}
        <div className="flex items-center justify-between gap-2 border-border/20 border-t pt-3.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <HugeiconsIcon className="h-3 w-3 shrink-0" icon={Calendar01Icon} />
            <span className="font-semibold text-[10px] uppercase tracking-wider">
              {getDeadlineLabel(project.deadline ?? "")}
            </span>
          </div>
          <span className="inline-flex items-center rounded border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-0.5 font-bold text-[10px] text-emerald-700 tracking-tight dark:text-emerald-300">
            ${project.budget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
