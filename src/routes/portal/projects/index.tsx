import {
  ArrowRight01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import { PortalProjectsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { PortalShell } from "@/components/layout/portal-shell";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectMilestonesData,
  useProjectsData,
} from "@/lib/api";
import { getDeadlineLabel } from "@/lib/insights";
import { getProjectPathParams } from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/projects/")({
  beforeLoad: requireClientSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: PortalProjectsPendingPage,
  component: PortalProjectsPage,
});

function ProjectListRow({
  project,
  clientSlug,
  projectSlug,
}: {
  project: {
    id: string;
    title: string;
    description: string | null;
    budget: number;
    deadline: string | null;
    status: "planning" | "in_progress" | "completed";
  };
  clientSlug: string;
  projectSlug: string;
}) {
  const milestonesQuery = useProjectMilestonesData(project.id);
  const milestones = milestonesQuery.data ?? [];
  const completed = milestones.filter((m) => m.status === "done").length;
  const total = milestones.length;
  let pct = 0;
  if (total > 0) {
    pct = Math.round((completed / total) * 100);
  } else if (project.status === "completed") {
    pct = 100;
  } else if (project.status === "in_progress") {
    pct = 60;
  } else {
    pct = 20;
  }

  const barColor =
    pct === 100
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-primary"
        : "bg-amber-500";

  return (
    <Link
      className="group flex items-center gap-4 border-border/15 border-b px-1 py-3 transition-colors duration-150 last:border-b-0 hover:bg-secondary/30"
      params={{ clientSlug, projectSlug }}
      to="/portal/projects/$clientSlug/$projectSlug"
    >
      {/* Status dot */}
      <div
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          project.status === "completed"
            ? "bg-emerald-500"
            : project.status === "in_progress"
              ? "bg-amber-500"
              : "bg-muted-foreground/40"
        )}
      />

      {/* Title + description */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-[#08361f] text-sm leading-tight transition-colors group-hover:text-primary dark:text-foreground dark:group-hover:text-primary">
          {project.title}
        </p>
        {project.description ? (
          <p className="mt-0.5 truncate text-muted-foreground text-xs">
            {project.description}
          </p>
        ) : null}
      </div>

      {/* Progress */}
      <div className="hidden w-24 shrink-0 sm:block">
        {milestonesQuery.isLoading ? (
          <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                <HugeiconsIcon
                  className="inline h-2.5 w-2.5"
                  icon={CheckmarkCircle01Icon}
                />
              </span>
              <span className="font-bold text-foreground">
                {completed}/{total}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Deadline */}
      <div className="hidden shrink-0 items-center gap-1 text-muted-foreground md:flex">
        <HugeiconsIcon className="h-3 w-3" icon={Calendar01Icon} />
        <span className="font-semibold text-[10px] uppercase tracking-wider">
          {getDeadlineLabel(project.deadline ?? "")}
        </span>
      </div>

      {/* Status badge */}
      <StatusBadge value={project.status} />

      {/* Arrow */}
      <HugeiconsIcon
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary"
        icon={ArrowRight01Icon}
      />
    </Link>
  );
}

function PortalProjectsPage() {
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();

  return (
    <PortalShell>
      <PageHeader
        description="A clean register of every project currently visible to your account."
        title="Your Projects"
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
          description="Your visible projects will appear here."
          title="No projects available"
        />
      ) : null}
      {!(
        projectsQuery.isLoading ||
        clientsQuery.isLoading ||
        projectsQuery.error ||
        clientsQuery.error
      ) && (projectsQuery.data?.length ?? 0) > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
              Project Register
            </h2>
            <span className="font-semibold text-muted-foreground text-xs">
              {projectsQuery.data?.length ?? 0} projects
            </span>
          </div>
          <div className="divide-y divide-border/15 rounded-xl border border-border/40 bg-card/20 px-4">
            {projectsQuery.data?.map((project) => {
              const { clientSlug, projectSlug } = getProjectPathParams(
                project,
                clientsQuery.data ?? []
              );
              return (
                <ProjectListRow
                  clientSlug={clientSlug}
                  key={project.id}
                  project={project}
                  projectSlug={projectSlug}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
