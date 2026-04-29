import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import { ClientDetailPendingPage } from "@/components/common/route-pending";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ensureClientsData,
  ensurePendingInvitesData,
  ensureProjectsData,
  type LoadableData,
  type PendingInvite,
  useClientsData,
  usePendingInvitesData,
  useProjectsData,
  useUpdateClientMutation,
} from "@/lib/api";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";
import { getProjectPathParams } from "@/lib/project-slugs";

export const Route = createFileRoute("/clients/$id")({
  beforeLoad: requireAdminSession,
  loader: ({ context, params }) => {
    const clientsPromise = ensureClientsData(context.queryClient);
    const projectsPromise = ensureProjectsData(context.queryClient);

    return clientsPromise.then((clients) => {
      const client = findClientByPathParam(clients, params.id);
      const pendingInvitesPromise = client
        ? ensurePendingInvitesData(context.queryClient, client.id)
        : Promise.resolve();

      return Promise.all([projectsPromise, pendingInvitesPromise]).then(
        () => undefined
      );
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl">{client.company}</h1>
          <p className="mt-1 text-slate-600 text-sm">{client.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-white p-4 text-sm">
        <p>
          <strong>Contact:</strong> {client.name}
        </p>
        <p>
          <strong>Email:</strong> {client.email}
        </p>
        <p>
          <strong>Phone:</strong> {client.phone}
        </p>
        <p>
          <strong>Website:</strong> {client.website}
        </p>
        <p>
          <strong>Notes:</strong> {client.notes}
        </p>
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-medium text-lg">Linked projects</h2>
        {linkedProjects.length === 0 ? (
          <p className="text-slate-600 text-sm">
            No projects are linked to this client yet.
          </p>
        ) : (
          <div className="grid gap-3">
            {linkedProjects.map((project) => {
              const { clientSlug, projectSlug } = getProjectPathParams(
                project,
                [client]
              );

              return (
                <div
                  className="rounded-lg border border-slate-200 p-3"
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      className="font-medium hover:underline"
                      params={{ clientSlug, projectSlug }}
                      to="/projects/$clientSlug/$projectSlug"
                    >
                      {project.title}
                    </Link>
                    <StatusBadge value={project.status} />
                  </div>
                  <p className="mt-2 text-slate-600 text-sm">
                    Deadline: {project.deadline || "No deadline yet"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
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

  return (
    <section className="mt-4 rounded-xl border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium text-lg">Pending invites</h2>
        <Badge variant="outline">{invites.length} pending</Badge>
      </div>
      {pendingInvites.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
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
        <div className="grid gap-3">
          {invites.map((invite) => (
            <div
              className="rounded-lg border border-slate-200 p-3"
              key={invite.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{invite.email}</p>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <dl className="mt-2 grid gap-2 text-slate-600 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-700">Created</dt>
                  <dd>
                    <time dateTime={invite.createdAt}>
                      {formatInviteDate(invite.createdAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Expires</dt>
                  <dd>
                    <time dateTime={invite.expiresAt}>
                      {formatInviteDate(invite.expiresAt)}
                    </time>
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
