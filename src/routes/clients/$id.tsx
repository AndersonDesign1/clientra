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
import { Button } from "@/components/ui/button";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
  useUpdateClientMutation,
} from "@/lib/api";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";
import { getProjectPathParams } from "@/lib/project-slugs";

export const Route = createFileRoute("/clients/$id")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
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

  const client = findClientByPathParam(clientsQuery.data ?? [], id);
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
    </AppShell>
  );
}
