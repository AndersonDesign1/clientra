import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import { ClientsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/features/clients/mock-data";
import { ensureClientsData, useClientsData, useSearchData } from "@/lib/api";
import { getClientPathParam } from "@/lib/client-slugs";

export const Route = createFileRoute("/clients/")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => ensureClientsData(context.queryClient),
  pendingComponent: ClientsPendingPage,
  component: ClientsPage,
});

function ClientsPage() {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const clientsQuery = useClientsData();
  const searchQuery = useSearchData(deferredQuery);

  const isSearching = deferredQuery.length > 0;
  const isLoading = isSearching
    ? searchQuery.isLoading
    : clientsQuery.isLoading;
  const error = isSearching ? searchQuery.error : clientsQuery.error;
  const visibleClients = isSearching
    ? (searchQuery.data?.clients ?? [])
    : (clientsQuery.data ?? []);
  const matchedProjects = isSearching ? (searchQuery.data?.projects ?? []) : [];
  const clientsContent = getClientsContent({
    error,
    isLoading,
    isSearching,
    onEdit: setEditingClient,
    visibleClients,
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl">Clients</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border p-2 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients or projects"
            value={query}
          />
          <ClientFormDialog
            onOpenChange={setIsCreateOpen}
            open={isCreateOpen}
            trigger={<Button>New client</Button>}
          />
        </div>
      </div>
      {clientsContent}
      {editingClient ? (
        <ClientFormDialog
          client={editingClient}
          onOpenChange={(open) => {
            if (!open) {
              setEditingClient(null);
            }
          }}
          open={Boolean(editingClient)}
          trigger={null}
        />
      ) : null}
      <ProjectMatchesSection
        isLoading={isLoading}
        isSearching={isSearching}
        matchedProjects={matchedProjects}
        searchError={error}
      />
    </AppShell>
  );
}

function getClientsContent({
  error,
  isLoading,
  isSearching,
  onEdit,
  visibleClients,
}: {
  error: string | null;
  isLoading: boolean;
  isSearching: boolean;
  onEdit: (client: Client) => void;
  visibleClients: Client[];
}) {
  if (isLoading) {
    return <LoadingPanel />;
  }

  if (error) {
    return <ErrorPanel description={error} />;
  }

  if (visibleClients.length === 0) {
    return (
      <EmptyPanel
        description={
          isSearching
            ? "No clients matched your search."
            : "Create your first client to start tracking delivery work."
        }
        title={isSearching ? "No matching clients" : "No clients yet"}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleClients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  className="underline"
                  params={{ id: getClientPathParam(client) }}
                  to="/clients/$id"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{client.company}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>
                <StatusBadge value={client.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => onEdit(client)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <DeleteClientDialog
                    client={client}
                    trigger={
                      <Button size="sm" type="button" variant="destructive">
                        Delete
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectMatchesSection({
  isSearching,
  isLoading,
  matchedProjects,
  searchError,
}: {
  isSearching: boolean;
  isLoading: boolean;
  matchedProjects: Array<{
    id: string;
    title: string;
    status: string;
    deadline: string;
  }>;
  searchError: string | null;
}) {
  if (!isSearching || isLoading || searchError) {
    return null;
  }

  if (matchedProjects.length === 0) {
    return (
      <section className="mt-6">
        <EmptyPanel
          description="No projects matched the current search."
          title="No matching projects"
        />
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border bg-white p-4">
      <h2 className="mb-3 font-medium text-lg">Matching Projects</h2>
      <div className="grid gap-3">
        {matchedProjects.map((project) => (
          <div
            className="rounded-lg border border-slate-200 p-3"
            key={project.id}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium">{project.title}</p>
              <StatusBadge value={project.status} />
            </div>
            <p className="mt-2 text-slate-600 text-sm">
              Deadline: {project.deadline}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
