import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DeleteProjectDialog } from "@/components/admin/crud-dialogs";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import { useProjectMilestonesData } from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import { getProjectPathParams } from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

interface ProjectRegisterTableProps {
  clients: Client[];
  onEdit?: (project: Project) => void;
  projects: Project[];
  showActions?: boolean;
}

export function ProjectRegisterTable({
  projects,
  clients,
  showActions = false,
  onEdit,
}: ProjectRegisterTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <Table>
        <TableHeader className="border-border/40 border-b">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pr-4 pl-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Project
            </TableHead>
            <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Velocity
            </TableHead>
            <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Budget
            </TableHead>
            <TableHead className="px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Deadline
            </TableHead>
            {showActions && (
              <TableHead className="pr-4 pl-4 text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/15">
          {projects.map((project) => (
            <ProjectRegisterRow
              clients={clients}
              key={project.id}
              onEdit={onEdit}
              project={project}
              showActions={showActions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectRegisterRow({
  project,
  clients,
  showActions,
  onEdit,
}: {
  project: Project;
  clients: Client[];
  showActions: boolean;
  onEdit?: (project: Project) => void;
}) {
  const navigate = useNavigate();
  const milestonesQuery = useProjectMilestonesData(project.id);
  const milestones = milestonesQuery.data ?? [];

  const { clientSlug, projectSlug } = getProjectPathParams(project, clients);

  const completed = milestones.filter((m) => m.status === "done").length;
  const total = milestones.length;
  let progress = 0;

  if (total > 0) {
    progress = Math.round((completed / total) * 100);
  } else if (project.status === "completed") {
    progress = 100;
  } else if (project.status === "in_progress") {
    progress = 60;
  } else {
    progress = 20; // planning
  }

  let progressColor = "bg-amber-500";
  if (progress === 100) {
    progressColor = "bg-emerald-600";
  } else if (progress >= 50) {
    progressColor = "bg-primary";
  }

  return (
    <TableRow
      className="group/row cursor-pointer border-border/25 transition-colors hover:bg-accent/40"
      onClick={() =>
        navigate({
          to: "/projects/$clientSlug/$projectSlug",
          params: { clientSlug, projectSlug },
        })
      }
    >
      <TableCell className="max-w-[240px] py-3.5 pr-4 pl-4">
        <Link
          className="block truncate font-extrabold text-brand-heading text-sm group-hover/row:underline"
          onClick={(e) => e.stopPropagation()}
          params={{ clientSlug, projectSlug }}
          to="/projects/$clientSlug/$projectSlug"
        >
          {project.title}
        </Link>
        {project.description && (
          <p className="mt-0.5 line-clamp-1 font-normal text-muted-foreground text-xs">
            {project.description}
          </p>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <StatusBadge value={project.status} />
      </TableCell>
      <TableCell className="w-[180px] px-4 py-3.5">
        {milestonesQuery.isLoading ? (
          <div className="space-y-1">
            <div className="h-3 w-8 animate-pulse rounded bg-muted" />
            <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-muted-foreground">
                {progress}%
              </span>
              <span className="font-medium text-muted-foreground/80">
                ({completed}/{total})
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  progressColor
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 font-extrabold text-emerald-800 text-xs tabular-nums dark:text-emerald-400">
        ${project.budget.toLocaleString()}
      </TableCell>
      <TableCell className="px-4 py-3.5 font-medium text-muted-foreground text-xs">
        {getDeadlineLabel(project.deadline ?? "")}
      </TableCell>
      {showActions && (
        <TableCell className="py-3.5 pr-4 pl-4 text-right">
          <div className="flex justify-end gap-2">
            {onEdit && (
              <Button
                className="h-8 border border-border/40 px-3 font-semibold text-xs transition-transform duration-200 hover:scale-105 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                type="button"
                variant="outline"
              >
                Edit
              </Button>
            )}
            <DeleteProjectDialog
              project={project}
              trigger={
                <Button
                  className="h-8 w-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                  onClick={(e) => e.stopPropagation()}
                  size="icon"
                  type="button"
                  variant="destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                  <span className="sr-only">Delete</span>
                </Button>
              }
            />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
