import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { ClientsPendingPage } from "@/components/common/route-pending";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { ensureClientsData, useClientsData, useSearchData } from "@/lib/api";

export const Route = createFileRoute("/clients/")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => ensureClientsData(context.queryClient),
  pendingComponent: ClientsPendingPage,
  component: ClientsPage,
});

function ClientsPage() {
  const [query, setQuery] = useState("");
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
    visibleClients,
  });

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Clients</h1>
        <input
          className="rounded-md border p-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clients or projects"
          value={query}
        />
      </div>
      {clientsContent}
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
  visibleClients,
}: {
  error: string | null;
  isLoading: boolean;
  isSearching: boolean;
  visibleClients: Array<{
    id: string;
    name: string;
    company: string;
    email: string;
    status: string;
  }>;
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
            : "Create your first client once write flows are connected."
        }
        title={isSearching ? "No matching clients" : "No clients yet"}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Company</th>
            <th className="p-3">Email</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleClients.map((client) => (
            <tr className="border-t" key={client.id}>
              <td className="p-3">
                <Link
                  className="underline"
                  params={{ id: client.id }}
                  to="/clients/$id"
                >
                  {client.name}
                </Link>
              </td>
              <td className="p-3">{client.company}</td>
              <td className="p-3">{client.email}</td>
              <td className="p-3">
                <StatusBadge value={client.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
