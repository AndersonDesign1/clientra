import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import { PageHeader } from "@/components/common/product-ui";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ensureClientsData,
  ensurePendingInvitesData,
  ensureProjectsData,
  type LoadableData,
  type PendingInvite,
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

function ClientDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();
  const updateClient = useUpdateClientMutation();
  const client = findClientByPathParam(clientsQuery.data ?? [], id);
  const pendingInvitesQuery = usePendingInvitesData(client?.id);

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

  const linkedProjects =
    projectsQuery.data?.filter((project) => project.clientId === client?.id) ??
    [];

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
        description={client.name}
        title={client.company}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Record definitions (Dossier) */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none md:col-span-1">
          <h2 className="font-semibold text-foreground text-sm">
            Client Record
          </h2>
          <div className="space-y-3">
            {[
              { label: "Contact", value: client.name },
              {
                label: "Email",
                value: client.email,
                isLink: true,
                href: `mailto:${client.email}`,
              },
              { label: "Phone", value: client.phone || "No phone" },
              {
                label: "Website",
                value: client.website || "No website",
                isLink: true,
                href: client.website?.startsWith("http")
                  ? client.website
                  : `https://${client.website}`,
              },
              { label: "Notes", value: client.notes || "No notes" },
              {
                label: "Tags",
                value: client.tags,
                isTags: true,
              },
            ].map((item) => {
              const renderValue = () => {
                if (item.isTags) {
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Array.isArray(item.value) && item.value.length > 0 ? (
                        item.value.map((tag) => (
                          <span
                            className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="font-medium text-muted-foreground text-sm">
                          No tags
                        </span>
                      )}
                    </div>
                  );
                }

                if (
                  item.isLink &&
                  item.href &&
                  typeof item.value === "string" &&
                  item.value !== "No email" &&
                  item.value !== "No website"
                ) {
                  return (
                    <p className="font-medium text-sm">
                      <a
                        className="text-primary transition-colors hover:underline"
                        href={item.href}
                        rel="noreferrer"
                        target={item.label === "Website" ? "_blank" : undefined}
                      >
                        {item.value}
                      </a>
                    </p>
                  );
                }

                return (
                  <p className="font-medium text-foreground text-sm">
                    {typeof item.value === "string" ? item.value : ""}
                  </p>
                );
              };

              return (
                <div className="space-y-1" key={item.label}>
                  <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </span>
                  {renderValue()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Linked Projects & Pending Invites in separate panels */}
        <div className="space-y-6 md:col-span-2">
          {/* Linked Projects */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none">
            <h2 className="font-semibold text-foreground text-sm">
              Linked Projects
            </h2>
            {linkedProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No projects are linked to this client yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {linkedProjects.map((project) => {
                  const { clientSlug, projectSlug } = getProjectPathParams(
                    project,
                    [client]
                  );

                  return (
                    <div
                      className="group flex flex-col justify-between gap-3 rounded-xl border border-border/50 bg-card/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
                      key={project.id}
                    >
                      <div className="space-y-1">
                        <Link
                          className="font-semibold text-foreground text-sm transition-colors duration-200 hover:text-primary"
                          params={{ clientSlug, projectSlug }}
                          to="/projects/$clientSlug/$projectSlug"
                        >
                          {project.title}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {getDeadlineLabel(project.deadline)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <StatusBadge value={project.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
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
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-none">
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
        <p className="text-muted-foreground text-xs">
          Loading pending invites...
        </p>
      ) : null}

      {!(pendingInvites.isLoading || pendingInvites.error) &&
      invites.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No pending invites for this client.
        </p>
      ) : null}

      {invites.length > 0 ? (
        <div className="divide-y divide-border/60 border-border/60 border-t">
          {invites.map((invite) => (
            <InviteRow
              invite={invite}
              key={invite.id}
              resendInvite={resendInvite}
              revokeInvite={revokeInvite}
            />
          ))}
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
    <div className="grid items-center gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_6rem_8rem_8rem_9rem]">
      <p className="font-semibold text-foreground">{invite.email}</p>
      <div>
        <StatusBadge value="pending" />
      </div>
      <time className="text-muted-foreground" dateTime={invite.createdAt}>
        Created: {formatInviteDate(invite.createdAt)}
      </time>
      <time className="text-muted-foreground" dateTime={invite.expiresAt}>
        Expires: {formatInviteDate(invite.expiresAt)}
      </time>
      <div className="flex items-center justify-end gap-2 sm:justify-start">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                className="h-8 text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                className="h-8 text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isResending || isRevoking}
                size="sm"
                type="button"
                variant="destructive"
              >
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
        <FieldError className="sm:col-span-5">{rowError}</FieldError>
      ) : null}
    </div>
  );
}
