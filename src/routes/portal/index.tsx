import { createFileRoute, Link } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
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
import { getProjectPathParams } from "@/lib/project-slugs";

export const Route = createFileRoute("/portal/")({
  beforeLoad: requireClientSession,
  loader: ({ context }) => ensurePortalSummaryData(context.queryClient),
  pendingComponent: PortalHomePendingPage,
  component: PortalHomePage,
});

function PortalHomePage() {
  const summaryQuery = usePortalSummaryData();

  return (
    <PortalShell>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">Client Portal</h1>
          <p className="mt-1 text-slate-600 text-sm">
            See active work, latest updates, upcoming milestones, and shared
            files.
          </p>
        </div>
        <Link className="text-sm underline" to="/portal/projects">
          View all projects
        </Link>
      </div>
      {summaryQuery.isLoading ? (
        <LoadingPanel
          description="We are loading the latest portal summary."
          title="Loading portal"
        />
      ) : null}
      {!summaryQuery.isLoading && summaryQuery.error ? (
        <ErrorPanel description={summaryQuery.error} />
      ) : null}
      {!(summaryQuery.isLoading || summaryQuery.error) && summaryQuery.data ? (
        <PortalSummaryView summary={summaryQuery.data} />
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
    <div className="grid gap-4">
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-medium text-lg">Active work</h2>
          <Badge variant="outline">
            {summary.activeProjects.length} active / {summary.projectCount}{" "}
            total
          </Badge>
        </div>
        {summary.activeProjects.length === 0 ? (
          <EmptyPanel
            description="Completed or upcoming projects will appear here when work is active."
            title="No active projects"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {summary.activeProjects.map((project) => {
              const { clientSlug, projectSlug } = getProjectPathParams(
                project,
                []
              );

              return (
                <article
                  className="rounded-lg border border-slate-200 p-3"
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <a
                      className="font-medium hover:underline"
                      href={`/portal/projects/${clientSlug}/${projectSlug}`}
                    >
                      {project.title}
                    </a>
                    <StatusBadge value={project.status} />
                  </div>
                  <p className="mt-2 text-slate-600 text-sm">
                    Deadline: {project.deadline || "No deadline yet"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-medium text-lg">Latest updates</h2>
          {summary.latestUpdates.length === 0 ? (
            <EmptyPanel
              description="Project status reports will appear here."
              title="No updates yet"
            />
          ) : (
            <div className="grid gap-3">
              {summary.latestUpdates.map((update) => (
                <article
                  className="rounded-lg border border-slate-200 p-3"
                  key={update.id}
                >
                  <p className="text-slate-500 text-xs">
                    {update.projectTitle} · {formatDate(update.createdAt)}
                  </p>
                  <h3 className="mt-1 font-medium">{update.title}</h3>
                  <p className="mt-2 line-clamp-2 text-slate-600 text-sm">
                    {update.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-medium text-lg">Upcoming milestones</h2>
          {summary.upcomingMilestones.length === 0 ? (
            <EmptyPanel
              description="Open deliverables and key dates will appear here."
              title="No upcoming milestones"
            />
          ) : (
            <div className="grid gap-3">
              {summary.upcomingMilestones.map((milestone) => (
                <article
                  className="rounded-lg border border-slate-200 p-3"
                  key={milestone.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-medium">{milestone.title}</h3>
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
        </section>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium text-lg">Recent files</h2>
        {summary.recentFiles.length === 0 ? (
          <EmptyPanel
            description="Shared project files will appear here."
            title="No files yet"
          />
        ) : (
          <div className="grid gap-3">
            {summary.recentFiles.map((file) => (
              <a
                className="rounded-lg border border-slate-200 p-3 hover:border-slate-300"
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
      </section>
    </div>
  );
}
