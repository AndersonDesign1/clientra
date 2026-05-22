import {
  ArrowRight01Icon,
  CallIcon,
  Delete02Icon,
  GlobalIcon,
  Mail01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import {
  BudgetComposedChart,
  ProjectStatusPieChart,
} from "@/components/common/product-charts";
import { MetricLedger, PageHeader } from "@/components/common/product-ui";
import { ClientDetailPendingPage } from "@/components/common/route-pending";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type Client,
  ensureClientsData,
  ensurePendingInvitesData,
  ensureProjectsData,
  type LoadableData,
  type PendingInvite,
  type Project,
  type ProjectMilestone,
  projectMilestonesQueryOptions,
  useClientsData,
  usePendingInvitesData,
  useProjectsData,
  useResendInviteMutation,
  useRevokeInviteMutation,
  useUpdateClientMutation,
} from "@/lib/api";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";
import { getDeadlineLabel } from "@/lib/insights";
import { getProjectPathParams } from "@/lib/project-slugs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clients/$id")({
  beforeLoad: requireAdminSession,
  loader: ({ context, params }) => {
    const clientsPromise = ensureClientsData(context.queryClient);
    const projectsPromise = ensureProjectsData(context.queryClient);

    return clientsPromise.then((clients) => {
      const client = findClientByPathParam(clients, params.id);

      if (client) {
        ensurePendingInvitesData(context.queryClient, client.id).catch(
          (error) => {
            console.error("pending invite prefetch failed", error);
          }
        );
      }

      return projectsPromise.then(() => undefined);
    });
  },
  pendingComponent: ClientDetailPendingPage,
  component: ClientDetailPage,
});

function getStatusLabel(status: string): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "planning":
      return "Planning";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function getMilestoneStats(
  milestoneQueries: { data?: ProjectMilestone[]; isLoading: boolean }[]
) {
  const milestonesLoading = milestoneQueries.some((q) => q.isLoading);

  let totalMilestones = 0;
  let completedMilestones = 0;
  for (const q of milestoneQueries) {
    if (q.data) {
      totalMilestones += q.data.length;
      completedMilestones += q.data.filter((m) => m.status === "done").length;
    }
  }

  const overallMilestoneProgress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return {
    milestonesLoading,
    totalMilestones,
    completedMilestones,
    overallMilestoneProgress,
  };
}

function getStatusPieData(linkedProjects: Project[]) {
  const statusCounts: Record<string, number> = {};
  for (const p of linkedProjects) {
    const statusLabel = getStatusLabel(p.status);
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1;
  }
  return Object.entries(statusCounts).map(([status, total]) => ({
    status,
    total,
  }));
}

function getBudgetComposedData(linkedProjects: Project[]) {
  const statusBudgets: Record<string, { budget: number; count: number }> = {};
  for (const p of linkedProjects) {
    const statusLabel = getStatusLabel(p.status);
    if (!statusBudgets[statusLabel]) {
      statusBudgets[statusLabel] = { budget: 0, count: 0 };
    }
    statusBudgets[statusLabel].budget += p.budget;
    statusBudgets[statusLabel].count += 1;
  }
  return Object.entries(statusBudgets).map(([status, info]) => ({
    status,
    budget: info.budget,
    count: info.count,
  }));
}

function ClientDossierWidget({
  client,
  formattedWebsite,
}: {
  client: Client;
  formattedWebsite: string;
}) {
  return (
    <div className="group relative flex h-fit flex-col justify-between gap-5 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)] md:col-span-1">
      <div className="space-y-4">
        <h3 className="font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
          Client Dossier
        </h3>

        <div className="space-y-4 pt-1">
          {[
            {
              label: "Primary Contact",
              value: client.name,
              icon: UserGroupIcon,
              isLink: false,
            },
            {
              label: "Email Address",
              value: client.email,
              isLink: true,
              href: `mailto:${client.email}`,
              icon: Mail01Icon,
            },
            {
              label: "Phone Number",
              value: client.phone || "No phone number",
              isLink: !!client.phone,
              href: client.phone ? `tel:${client.phone}` : undefined,
              icon: CallIcon,
            },
            {
              label: "Website URL",
              value: client.website || "No website URL",
              isLink: !!client.website,
              href: client.website ? formattedWebsite : undefined,
              icon: GlobalIcon,
            },
          ].map((item) => (
            <div className="flex items-start gap-3.5" key={item.label}>
              <div className="mt-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400">
                <HugeiconsIcon icon={item.icon} size={13} />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="block font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-wider">
                  {item.label}
                </span>
                {item.isLink && item.href ? (
                  <a
                    className="block truncate font-bold text-primary text-sm transition-colors hover:underline"
                    href={item.href}
                    rel="noreferrer"
                    target={
                      item.label.includes("Website") ? "_blank" : undefined
                    }
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="block truncate font-bold text-foreground text-sm">
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Notes block */}
          <div className="space-y-2 border-border/20 border-t pt-4">
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Client Notes
            </span>
            <div className="rounded-xl border-l-4 border-l-primary/65 bg-emerald-500/[0.04] p-3.5 text-muted-foreground/95 text-xs italic leading-relaxed">
              {client.notes || "No notes available for this client."}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 border-border/20 border-t pt-4">
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              Tags & Segments
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {Array.isArray(client.tags) && client.tags.length > 0 ? (
                client.tags.map((tag: string) => (
                  <span
                    className="inline-flex items-center rounded-md bg-emerald-500/[0.08] px-2.5 py-0.5 font-bold text-emerald-800 text-xs dark:text-emerald-300"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  No tags
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientProjectsTable({
  client,
  linkedProjects,
  milestoneQueries,
}: {
  client: Client;
  linkedProjects: Project[];
  milestoneQueries: { data?: ProjectMilestone[]; isLoading: boolean }[];
}) {
  return (
    <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
      <h2 className="font-extrabold text-base text-foreground tracking-tight">
        Linked Projects
      </h2>
      {linkedProjects.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          No projects are linked to this client yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40 bg-card">
          <Table>
            <TableHeader className="bg-secondary/15">
              <TableRow>
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Project
                </TableHead>
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Velocity
                </TableHead>
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Budget
                </TableHead>
                <TableHead className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Deadline
                </TableHead>
                <TableHead className="text-right font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedProjects.map((project, idx) => {
                const { clientSlug, projectSlug } = getProjectPathParams(
                  project,
                  [client]
                );

                const projectMilestones = milestoneQueries[idx]?.data ?? [];
                const completed = projectMilestones.filter(
                  (m: ProjectMilestone) => m.status === "done"
                ).length;
                const total = projectMilestones.length;
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
                    className="border-border/25 transition-colors hover:bg-secondary/5"
                    key={project.id}
                  >
                    <TableCell className="max-w-[240px]">
                      <Link
                        className="block truncate font-extrabold text-brand-heading text-sm hover:underline"
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
                    <TableCell>
                      <StatusBadge value={project.status} />
                    </TableCell>
                    <TableCell className="w-[180px]">
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
                    </TableCell>
                    <TableCell className="font-extrabold text-emerald-800 text-xs tabular-nums dark:text-emerald-400">
                      ${project.budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold text-muted-foreground text-xs">
                      {getDeadlineLabel(project.deadline ?? "")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-border/40 bg-secondary/40 px-3 font-bold text-primary text-xs transition-all hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                        params={{ clientSlug, projectSlug }}
                        to="/projects/$clientSlug/$projectSlug"
                      >
                        Dossier →
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ClientDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();
  const updateClient = useUpdateClientMutation();
  const client = findClientByPathParam(clientsQuery.data ?? [], id);
  const pendingInvitesQuery = usePendingInvitesData(client?.id);

  const linkedProjects = client
    ? (projectsQuery.data?.filter(
        (project) => project.clientId === client.id
      ) ?? [])
    : [];

  // Dynamic milestones aggregation hook query (unconditional list mapping via useQueries)
  const milestoneQueries = useQueries({
    queries: linkedProjects.map((project) =>
      projectMilestonesQueryOptions(project.id)
    ),
  });

  if (clientsQuery.isLoading || projectsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingPanel />
      </AppShell>
    );
  }

  if (clientsQuery.error || projectsQuery.error) {
    return (
      <AppShell>
        <ErrorPanel
          description={clientsQuery.error ?? projectsQuery.error ?? undefined}
        />
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell>
        <ErrorPanel
          description="We could not find a client with that id."
          title="Client not found"
        />
      </AppShell>
    );
  }

  const {
    milestonesLoading,
    totalMilestones,
    completedMilestones,
    overallMilestoneProgress,
  } = getMilestoneStats(milestoneQueries);

  // Investment and count stats
  const totalInvestment = linkedProjects.reduce((acc, p) => acc + p.budget, 0);
  const activeProjectsCount = linkedProjects.filter(
    (p) => p.status === "in_progress"
  ).length;
  const completedProjectsCount = linkedProjects.filter(
    (p) => p.status === "completed"
  ).length;

  const clientWebsite = client.website || "";
  const formattedWebsite = clientWebsite.startsWith("http")
    ? clientWebsite
    : `https://${clientWebsite}`;

  const selectedClient = client;

  async function toggleArchive() {
    await updateClient.mutateAsync({
      id: selectedClient.id,
      input: {
        company: selectedClient.company,
        email: selectedClient.email,
        name: selectedClient.name,
        notes: selectedClient.notes,
        phone: selectedClient.phone,
        status: selectedClient.status === "active" ? "archived" : "active",
        tags: selectedClient.tags,
        website: selectedClient.website,
      },
    });
  }

  // Construct charts data
  const statusPieData = getStatusPieData(linkedProjects);
  const budgetComposedData = getBudgetComposedData(linkedProjects);

  const ledgerItems = [
    {
      label: "Total Investment",
      value: `$${totalInvestment.toLocaleString()}`,
      detail: `Across ${linkedProjects.length} linked project${linkedProjects.length === 1 ? "" : "s"}`,
    },
    {
      label: "Project Inventory",
      value: `${activeProjectsCount} Active`,
      detail: `${completedProjectsCount} completed project${completedProjectsCount === 1 ? "" : "s"}`,
    },
    {
      label: "Milestone Velocity",
      value: milestonesLoading ? "..." : `${overallMilestoneProgress}%`,
      detail: milestonesLoading
        ? "Aggregating milestone records..."
        : `${completedMilestones} of ${totalMilestones} deliverables completed`,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={client.status} />
            <ClientFormDialog
              client={client}
              onOpenChange={setIsEditOpen}
              onSaved={(updatedClient) => {
                const nextPathParam = getClientPathParam(updatedClient);

                if (nextPathParam !== id) {
                  navigate({
                    params: { id: nextPathParam },
                    replace: true,
                    to: "/clients/$id",
                  }).catch(() => undefined);
                }
              }}
              open={isEditOpen}
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
            <Button
              className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              disabled={updateClient.isPending}
              onClick={() => {
                toggleArchive().catch(() => undefined);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {client.status === "active" ? "Archive" : "Restore"}
            </Button>
            <DeleteClientDialog
              client={client}
              onDeleted={() => {
                navigate({ to: "/clients" }).catch(() => undefined);
              }}
              trigger={
                <Button
                  className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Delete
                </Button>
              }
            />
          </div>
        }
        avatar={
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 font-bold text-white text-xl shadow-sm ring-4 ring-primary/10 transition-all duration-300 hover:scale-105">
            {client.company
              .split(" ")
              .map((w: string) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        }
        description={client.name}
        title={client.company}
      />

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Client Record Dossier Card (Borderless, Organic Minimalism) */}
        <ClientDossierWidget
          client={client}
          formattedWebsite={formattedWebsite}
        />

        {/* Right Column: Metrics, Charts, Linked Projects, Invites */}
        <div className="space-y-6 md:col-span-2">
          {/* Top Metric Ledger */}
          <MetricLedger items={ledgerItems} />

          {/* Client Analytics Section (Only for large data >= 4 projects) */}
          {linkedProjects.length >= 4 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                <h3 className="mb-3 font-semibold text-foreground text-sm">
                  Project Status Distribution
                </h3>
                <div className="relative flex min-h-[220px] flex-1 items-center justify-center">
                  <ProjectStatusPieChart
                    data={statusPieData}
                    isLoading={projectsQuery.isLoading}
                  />
                </div>
              </div>
              <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                <h3 className="mb-3 font-semibold text-foreground text-sm">
                  Budget & Project Allocation
                </h3>
                <div className="relative flex min-h-[220px] flex-1 items-center justify-center">
                  <BudgetComposedChart
                    data={budgetComposedData}
                    isLoading={projectsQuery.isLoading}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Linked Projects */}
          <ClientProjectsTable
            client={client}
            linkedProjects={linkedProjects}
            milestoneQueries={milestoneQueries}
          />

          {/* Pending Invites */}
          <PendingInvitesPanel
            clientId={client.id}
            pendingInvites={pendingInvitesQuery}
          />
        </div>
      </div>
    </AppShell>
  );
}

function formatInviteDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PendingInvitesPanel({
  clientId,
  pendingInvites,
}: {
  clientId: string;
  pendingInvites: LoadableData<PendingInvite[]>;
}) {
  const invites = pendingInvites.data ?? [];
  const resendInvite = useResendInviteMutation(clientId);
  const revokeInvite = useRevokeInviteMutation(clientId);

  let inviteBadgeStyle =
    "border-zinc-500/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";
  if (pendingInvites.isLoading) {
    inviteBadgeStyle = "border-border/50 bg-muted text-muted-foreground";
  } else if (invites.length > 0) {
    inviteBadgeStyle =
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return (
    <div className="group relative animate-slide-up-fade flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">
          Pending Invites
        </h2>
        <Badge
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-bold text-[0.65rem] uppercase tracking-wider transition-colors duration-200",
            inviteBadgeStyle
          )}
          variant={null}
        >
          {pendingInvites.isLoading ? "Loading" : `${invites.length} pending`}
        </Badge>
      </div>

      {pendingInvites.error ? (
        <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-3 text-rose-700 text-xs">
          {pendingInvites.error}
        </p>
      ) : null}

      {pendingInvites.isLoading ? (
        <p className="animate-pulse text-muted-foreground text-xs">
          Loading pending invites...
        </p>
      ) : null}

      {!(pendingInvites.isLoading || pendingInvites.error) &&
      invites.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">
          No pending invites for this client.
        </p>
      ) : null}

      {invites.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
          <div className="divide-y divide-border/60">
            {invites.map((invite) => (
              <InviteRow
                invite={invite}
                key={invite.id}
                resendInvite={resendInvite}
                revokeInvite={revokeInvite}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface InviteRowProps {
  invite: PendingInvite;
  resendInvite: ReturnType<typeof useResendInviteMutation>;
  revokeInvite: ReturnType<typeof useRevokeInviteMutation>;
}

function InviteRow({ invite, resendInvite, revokeInvite }: InviteRowProps) {
  const isResending =
    resendInvite.isPending && resendInvite.variables?.id === invite.id;
  const isRevoking =
    revokeInvite.isPending && revokeInvite.variables?.id === invite.id;

  const isResendError =
    resendInvite.variables?.id === invite.id && resendInvite.error != null;
  const isRevokeError =
    revokeInvite.variables?.id === invite.id && revokeInvite.error != null;
  let rowError: string | undefined;
  if (isResendError) {
    rowError = resendInvite.error.message;
  } else if (isRevokeError) {
    rowError = revokeInvite.error.message;
  }

  return (
    <div className="grid items-center gap-3 p-4 text-xs transition-colors duration-200 hover:bg-secondary/15 sm:grid-cols-[minmax(0,1.2fr)_0.8fr_1fr_1fr_1.2fr]">
      <p className="truncate font-semibold text-foreground">{invite.email}</p>
      <div>
        <StatusBadge value="pending" />
      </div>
      <time
        className="font-medium text-muted-foreground"
        dateTime={invite.createdAt}
      >
        Created: {formatInviteDate(invite.createdAt)}
      </time>
      <time
        className="font-medium text-muted-foreground"
        dateTime={invite.expiresAt}
      >
        Expires: {formatInviteDate(invite.expiresAt)}
      </time>
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                className="flex h-8 items-center gap-1.5 text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isResending || isRevoking}
                onClick={() => {
                  resendInvite.reset();
                  revokeInvite.reset();
                  resendInvite
                    .mutateAsync({
                      id: invite.id,
                    })
                    .catch(() => undefined);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                {isResending ? "Sending" : "Resend"}
              </Button>
            }
          />
          <TooltipContent>Send this invite email again.</TooltipContent>
        </Tooltip>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                className="flex h-8 items-center gap-1.5 text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isResending || isRevoking}
                size="sm"
                type="button"
                variant="destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} size={12} />
                Revoke
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this invite?</AlertDialogTitle>
              <AlertDialogDescription>
                This invite link will stop working immediately. The client can
                be invited again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevoking}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isRevoking}
                onClick={(event) => {
                  event.preventDefault();
                  resendInvite.reset();
                  revokeInvite.reset();
                  revokeInvite
                    .mutateAsync({
                      id: invite.id,
                    })
                    .catch(() => undefined);
                }}
                variant="destructive"
              >
                {isRevoking ? "Revoking..." : "Revoke invite"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {rowError ? (
        <FieldError className="mt-1 sm:col-span-5">{rowError}</FieldError>
      ) : null}
    </div>
  );
}
