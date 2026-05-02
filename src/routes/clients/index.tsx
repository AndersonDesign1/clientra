import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import {
  ClientFormDialog,
  DeleteClientDialog,
} from "@/components/admin/crud-dialogs";
import { DataSection, PageHeader } from "@/components/common/product-ui";
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
      <PageHeader
        actions={
          <>
            <input
              className="h-9 min-w-64 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients or projects"
              value={query}
            />
            <ClientFormDialog
              onOpenChange={setIsCreateOpen}
              open={isCreateOpen}
              trigger={<Button>New client</Button>}
            />
          </>
        }
        description="Manage client records, linked projects, and invite-ready accounts."
        title="Clients"
      />
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
    <div className="overflow-x-auto border-slate-200 border-y bg-white">
      <Table>
        <TableHeader className="bg-stone-50">
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
                  className="font-medium text-zinc-950 hover:underline"
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
    <DataSection className="mt-6" title="Matching projects">
      <div className="grid gap-3">
        {matchedProjects.map((project) => (
          <div
            className="grid gap-2 border-slate-200 border-t pt-3 text-sm first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_9rem_10rem] sm:items-center"
            key={project.id}
          >
            <p className="font-medium text-zinc-950">{project.title}</p>
            <StatusBadge value={project.status} />
            <p className="text-slate-600">Deadline: {project.deadline}</p>
          </div>
        ))}
      </div>
    </DataSection>
  );
}
