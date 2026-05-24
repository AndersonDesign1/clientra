import {
  ArrowRight01Icon,
  CallIcon,
  Copy01Icon,
  Delete02Icon,
  GlobalIcon,
  Mail01Icon,
  Tick02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { ProjectRegisterTable } from "@/components/projects/project-register-table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  queryKeys,
  useClientsData,
  usePendingInvitesData,
  useProjectsData,
  useResendInviteMutation,
  useRevokeInviteMutation,
  useUpdateClientMutation,
} from "@/lib/api";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";
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
    <div className="group relative flex h-fit flex-col justify-between gap-5 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)] md:col-span-1">
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
            <div className="rounded-lg bg-accent p-3.5 text-accent-foreground text-xs leading-relaxed">
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
                  className="h-8 w-8 shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
                  size="icon"
                  type="button"
                  variant="destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                  <span className="sr-only">Delete client</span>
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
              <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
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
              <div className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
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
          <div
            className="group relative flex animate-slide-up-fade flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]"
            style={{ animationDelay: "150ms" }}
          >
            <h2 className="font-extrabold text-base text-foreground tracking-tight">
              Linked Projects
            </h2>
            {linkedProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                No projects are linked to this client yet.
              </p>
            ) : (
              <ProjectRegisterTable
                clients={[client]}
                projects={linkedProjects}
                showActions={false}
              />
            )}
          </div>

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
    <div className="group relative flex animate-slide-up-fade flex-col justify-between gap-4 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <CreateInviteDialog clientId={clientId} />
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
        <div className="overflow-hidden pt-1">
          <div className="divide-y divide-border/60 border-border/40 border-t">
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
    <div className="grid items-center gap-3 px-0 py-3.5 text-xs transition-colors duration-200 hover:bg-secondary/15 sm:grid-cols-[minmax(0,1.2fr)_0.8fr_1fr_1fr_1.2fr]">
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
                className="flex h-8 items-center gap-1.5 border border-border/40 bg-background text-muted-foreground text-xs transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                disabled={isResending || isRevoking}
                size="sm"
                type="button"
                variant="ghost"
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

export function CreateInviteDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInviteLink(null);
    setCopied(false);

    try {
      const response = await fetch("/api/invites", {
        body: JSON.stringify({
          clientId,
          email,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        inviteLink?: string;
      } | null;

      if (!(response.ok && data?.inviteLink)) {
        setError(data?.error ?? "Unable to create invite.");
        setIsSubmitting(false);
        return;
      }

      setInviteLink(data.inviteLink);
      setEmail("");
      setIsSubmitting(false);

      // Invalidate the query cache to refresh pending invites
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingInvites(clientId),
      });
    } catch {
      setError("Network error creating invite.");
      setIsSubmitting(false);
    }
  }

  function handleCopy() {
    if (!inviteLink) {
      return;
    }
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy invite link:", error);
        setCopied(false);
        setError("Unable to copy invite link. Please copy it manually.");
      });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset form states on close
      setEmail("");
      setError(null);
      setInviteLink(null);
      setCopied(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button
            className="h-8 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            size="sm"
            type="button"
            variant="outline"
          >
            Create Invite
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invite Link</DialogTitle>
          <DialogDescription>
            Generate a secure invite link to grant client access to their portal
            workspace.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-teal-200/50 bg-teal-50/10 px-4 py-3.5 text-teal-800 text-xs dark:text-teal-400">
              <p className="font-bold uppercase tracking-wider">Invite Ready</p>
              <p className="mt-1 leading-normal">
                Share this secure URL with the client. It will expire in seven
                days.
              </p>
            </div>

            <div className="flex gap-2">
              <code className="max-h-24 flex-1 select-all overflow-y-auto break-all rounded-lg border border-border/10 bg-secondary/15 px-3 py-2.5 font-mono text-[11px] text-foreground leading-normal">
                {inviteLink}
              </code>
              <Button
                className="h-10 w-10 shrink-0 border border-border/40 bg-background text-muted-foreground transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={handleCopy}
                size="icon"
                type="button"
                variant="outline"
              >
                <HugeiconsIcon
                  className={cn(
                    "transition-transform duration-200",
                    copied && "scale-110 text-emerald-600"
                  )}
                  icon={copied ? Tick02Icon : Copy01Icon}
                  size={14}
                />
                <span className="sr-only">
                  {copied ? "Copied" : "Copy to Clipboard"}
                </span>
              </Button>
            </div>

            <DialogFooter>
              <Button
                className="w-full font-bold"
                onClick={() => handleOpenChange(false)}
                type="button"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block font-bold text-foreground text-xs uppercase tracking-wider"
                htmlFor="invite-email"
              >
                Client Email Address
              </label>
              <Input
                className="h-10 w-full border-border/40 bg-background text-sm transition-all focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:ring-offset-0"
                id="invite-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 px-4 py-2.5 font-semibold text-rose-700 text-xs dark:text-rose-400">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Generating..." : "Generate Link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
