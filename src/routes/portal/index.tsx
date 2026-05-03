import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import {
  DeadlineBarChart,
  StatusBarChart,
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
import { StatusBadge } from "@/components/common/status-badge";
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
            className="text-sm text-zinc-950 underline"
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
              <StatusBarChart
                data={getProjectStatusData(summary.activeProjects)}
              />
              <DeadlineBarChart
                data={getDeadlineData(summary.activeProjects)}
              />
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
          <div className="divide-y divide-slate-200 border-slate-200 border-y">
            {summary.activeProjects.map((project) => {
              const projectSlug = getProjectPathParam(project);

              return (
                <article
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_10rem] sm:items-center"
                  key={project.id}
                >
                  <a
                    className="font-medium text-zinc-950 hover:underline"
                    href={`/portal/projects/${project.clientSlug}/${projectSlug}`}
                  >
                    {project.title}
                  </a>
                  <StatusBadge value={project.status} />
                  <p className="text-slate-600">
                    {getDeadlineLabel(project.deadline)}
                  </p>
                </article>
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
            <div className="divide-y divide-slate-200 border-slate-200 border-y">
              {summary.latestUpdates.map((update) => (
                <article className="py-3" key={update.id}>
                  <p className="text-slate-500 text-xs">
                    {update.projectTitle} · {formatDate(update.createdAt)}
                  </p>
                  <h3 className="mt-1 font-medium text-zinc-950">
                    {update.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-slate-600 text-sm">
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
            <div className="divide-y divide-slate-200 border-slate-200 border-y">
              {summary.upcomingMilestones.map((milestone) => (
                <article className="py-3" key={milestone.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-medium text-zinc-950">
                      {milestone.title}
                    </h3>
                    <Badge variant="outline">
                      {milestone.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-slate-600 text-sm">
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
          <div className="divide-y divide-slate-200 border-slate-200 border-y">
            {summary.recentFiles.map((file) => (
              <a
                className="block py-3 hover:text-zinc-950"
                href={file.fileUrl}
                key={file.id}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-medium">{file.fileName}</p>
                <p className="mt-1 text-slate-600 text-sm">
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
