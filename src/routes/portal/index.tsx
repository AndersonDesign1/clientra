import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import {
  DeadlineAreaChart,
  ProjectStatusPieChart,
} from "@/components/common/product-charts";
import {
  DataSection,
  MetricLedger,
  PageHeader,
} from "@/components/common/product-ui";
import { PortalHomePendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import {
  ensurePortalSummaryData,
  type PortalSummary,
  usePortalSummaryData,
} from "@/lib/api";
import {
  getDeadlineData,
  getDeadlineLabel,
  getNextDeadline,
  getProjectStatusData,
} from "@/lib/insights";
import { getProjectPathParam } from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

function getStatusDotClass(status: string): string {
  if (status === "completed") {
    return "bg-emerald-500";
  }
  if (status === "in_progress") {
    return "bg-amber-500";
  }
  return "bg-muted-foreground/40";
}

export const Route = createFileRoute("/portal/")({
  beforeLoad: requireClientSession,
  loader: ({ context }) => ensurePortalSummaryData(context.queryClient),
  pendingComponent: PortalHomePendingPage,
  component: PortalHomePage,
});

function PortalHomePage() {
  const summaryQuery = usePortalSummaryData();
  const summary = summaryQuery.data;
  const nextDeadline = summary ? getNextDeadline(summary.activeProjects) : null;

  return (
    <PortalShell>
      <PageHeader
        actions={
          <Link
            className="font-semibold text-foreground/80 text-sm underline underline-offset-2 transition-colors hover:text-primary"
            to="/portal/projects"
          >
            View all projects
          </Link>
        }
        description="See active work, latest updates, upcoming milestones, and shared files."
        title="Client Portal"
      />
      {summaryQuery.isLoading ? (
        <LoadingPanel
          description="We are loading the latest portal summary."
          title="Loading portal"
        />
      ) : null}
      {!summaryQuery.isLoading && summaryQuery.error ? (
        <ErrorPanel description={summaryQuery.error} />
      ) : null}
      {summary && !summaryQuery.error ? (
        <>
          <MetricLedger
            items={[
              {
                detail: `${summary.activeProjects.length} active`,
                label: "Visible projects",
                value: summary.projectCount,
              },
              {
                detail: "Open deliverables and key dates",
                label: "Upcoming milestones",
                value: summary.upcomingMilestones.length,
              },
              {
                detail: nextDeadline?.title ?? "No upcoming date",
                label: "Next deadline",
                value: nextDeadline
                  ? getDeadlineLabel(nextDeadline.deadline)
                  : "None",
              },
            ]}
          />
          <DataSection className="mt-6" title="Project overview">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <h3 className="mb-4 font-semibold text-foreground text-xs uppercase tracking-wider">
                  Status Distribution
                </h3>
                <ProjectStatusPieChart
                  data={getProjectStatusData(summary.activeProjects)}
                />
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <h3 className="mb-4 font-semibold text-foreground text-xs uppercase tracking-wider">
                  Upcoming Deadlines
                </h3>
                <DeadlineAreaChart
                  data={getDeadlineData(summary.activeProjects)}
                />
              </div>
            </div>
          </DataSection>
          <PortalSummaryView summary={summary} />
        </>
      ) : null}
    </PortalShell>
  );
}

function formatDate(value: string) {
  if (!value) {
    return "No date set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PortalSummaryView({ summary }: { summary: PortalSummary }) {
  return (
    <div className="grid gap-1">
      <DataSection
        actions={
          <Badge variant="outline">
            {summary.activeProjects.length} active / {summary.projectCount}{" "}
            total
          </Badge>
        }
        title="Active work"
      >
        {summary.activeProjects.length === 0 ? (
          <EmptyPanel
            description="Completed or upcoming projects will appear here when work is active."
            title="No active projects"
          />
        ) : (
          <div className="divide-y divide-border/15 rounded-xl border border-border/40 bg-card/20">
            {summary.activeProjects.map((project) => {
              const projectSlug = getProjectPathParam(project);

              return (
                <Link
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/30"
                  key={project.id}
                  params={{
                    clientSlug: project.clientSlug,
                    projectSlug,
                  }}
                  to="/portal/projects/$clientSlug/$projectSlug"
                >
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      getStatusDotClass(project.status)
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#08361f] text-sm group-hover:text-primary dark:text-foreground dark:group-hover:text-primary">
                      {project.title}
                    </p>
                    {project.description ? (
                      <p className="mt-0.5 truncate text-muted-foreground text-xs">
                        {project.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                    {getDeadlineLabel(project.deadline ?? "")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </DataSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataSection title="Latest updates">
          {summary.latestUpdates.length === 0 ? (
            <EmptyPanel
              description="Project status reports will appear here."
              title="No updates yet"
            />
          ) : (
            <div className="divide-y divide-border/15 border-border/30 border-y">
              {summary.latestUpdates.map((update) => (
                <article className="py-3" key={update.id}>
                  <p className="text-[10px] text-muted-foreground">
                    {update.projectTitle} · {formatDate(update.createdAt)}
                  </p>
                  <h3 className="mt-1 font-semibold text-foreground text-sm">
                    {update.title}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                    {update.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DataSection>

        <DataSection title="Upcoming milestones">
          {summary.upcomingMilestones.length === 0 ? (
            <EmptyPanel
              description="Open deliverables and key dates will appear here."
              title="No upcoming milestones"
            />
          ) : (
            <div className="divide-y divide-border/15 border-border/30 border-y">
              {summary.upcomingMilestones.map((milestone) => (
                <article className="py-3" key={milestone.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground text-sm">
                      {milestone.title}
                    </h3>
                    <Badge className="text-[10px]" variant="outline">
                      {milestone.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-muted-foreground text-xs">
                    {milestone.projectTitle} · Due{" "}
                    {formatDate(milestone.dueDate)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </DataSection>
      </div>

      <DataSection title="Recent files">
        {summary.recentFiles.length === 0 ? (
          <EmptyPanel
            description="Shared project files will appear here."
            title="No files yet"
          />
        ) : (
          <div className="divide-y divide-border/15 border-border/30 border-y">
            {summary.recentFiles.map((file) => (
              <a
                className="group block py-3"
                href={file.fileUrl}
                key={file.id}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
                  {file.fileName}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  {file.projectTitle} · {formatDate(file.createdAt)}
                </p>
              </a>
            ))}
          </div>
        )}
      </DataSection>
    </div>
  );
}
