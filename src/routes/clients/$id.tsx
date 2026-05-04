import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import {
  DataSection,
  DefinitionGrid,
  PageHeader,
} from "@/components/common/product-ui";
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
          <>
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
                <Button size="sm" type="button" variant="outline">
                  Edit
                </Button>
              }
            />
            <Button
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
                <Button size="sm" type="button" variant="destructive">
                  Delete
                </Button>
              }
            />
          </>
        }
        description={client.name}
        title={client.company}
      />
      <DataSection title="Client record">
        <DefinitionGrid
          items={[
            { label: "Contact", value: client.name },
            { label: "Email", value: client.email },
            { label: "Phone", value: client.phone || "No phone" },
            { label: "Website", value: client.website || "No website" },
            { label: "Notes", value: client.notes || "No notes" },
            {
              label: "Tags",
              value:
                client.tags.length > 0 ? client.tags.join(", ") : "No tags",
            },
          ]}
        />
      </DataSection>
      <DataSection title="Linked projects">
        {linkedProjects.length === 0 ? (
          <p className="text-slate-600 text-sm">
            No projects are linked to this client yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 border-slate-200 border-y">
            {linkedProjects.map((project) => {
              const { clientSlug, projectSlug } = getProjectPathParams(
                project,
                [client]
              );

              return (
                <div
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_9rem_10rem] sm:items-center"
                  key={project.id}
                >
                  <Link
                    className="font-medium text-zinc-950 hover:underline"
                    params={{ clientSlug, projectSlug }}
                    to="/projects/$clientSlug/$projectSlug"
                  >
                    {project.title}
                  </Link>
                  <StatusBadge value={project.status} />
                  <p className="text-slate-600">
                    {getDeadlineLabel(project.deadline)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </DataSection>
      <PendingInvitesPanel pendingInvites={pendingInvitesQuery} />
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
  pendingInvites,
}: {
  pendingInvites: LoadableData<PendingInvite[]>;
}) {
  const invites = pendingInvites.data ?? [];
  const resendInvite = useResendInviteMutation();
  const revokeInvite = useRevokeInviteMutation();

  return (
    <DataSection
      actions={
        <Badge variant="outline">
          {pendingInvites.isLoading ? "Loading" : `${invites.length} pending`}
        </Badge>
      }
      title="Pending invites"
    >
      {pendingInvites.error ? (
        <p className="border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {pendingInvites.error}
        </p>
      ) : null}
      {pendingInvites.isLoading ? (
        <p className="text-slate-600 text-sm">Loading pending invites...</p>
      ) : null}
      {!(pendingInvites.isLoading || pendingInvites.error) &&
      invites.length === 0 ? (
        <p className="text-slate-600 text-sm">
          No pending invites for this client.
        </p>
      ) : null}
      {invites.length > 0 ? (
        <div className="divide-y divide-slate-200 border-slate-200 border-y">
          {invites.map((invite) => {
            const isResending =
              resendInvite.isPending &&
              resendInvite.variables?.id === invite.id;
            const isRevoking =
              revokeInvite.isPending &&
              revokeInvite.variables?.id === invite.id;
            const rowError =
              resendInvite.variables?.id === invite.id
                ? resendInvite.error?.message
                : revokeInvite.variables?.id === invite.id
                  ? revokeInvite.error?.message
                  : undefined;

            return (
              <div
                className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_8rem_8rem_9rem]"
                key={invite.id}
              >
                <p className="font-medium text-zinc-950">{invite.email}</p>
                <Badge variant="secondary">Pending</Badge>
                <time className="text-slate-600" dateTime={invite.createdAt}>
                  {formatInviteDate(invite.createdAt)}
                </time>
                <time className="text-slate-600" dateTime={invite.expiresAt}>
                  {formatInviteDate(invite.expiresAt)}
                </time>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          disabled={isResending || isRevoking}
                          onClick={() => {
                            resendInvite.reset();
                            revokeInvite.reset();
                            resendInvite
                              .mutateAsync({
                                clientId: invite.clientId,
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
                    <TooltipContent>
                      Send this invite email again.
                    </TooltipContent>
                  </Tooltip>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
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
                          This invite link will stop working immediately. The
                          client can be invited again later.
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
                                clientId: invite.clientId,
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
          })}
        </div>
      ) : null}
    </DataSection>
  );
}
