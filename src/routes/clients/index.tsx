import { Delete02Icon, FolderAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import type { Client } from "@/features/clients/mock-data";
import {
  ensureClientsData,
  ensureProjectsData,
  useClientsData,
  useProjectsData,
  useSearchData,
} from "@/lib/api";
import { getClientPathParam } from "@/lib/client-slugs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clients/")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => {
    return Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]).then(() => undefined);
  },
  pendingComponent: ClientsPendingPage,
  component: ClientsPage,
});

const WHITESPACE_REGEX = /\s+/;

function getInitials(name: string) {
  const parts = name.split(WHITESPACE_REGEX).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts.at(-1)?.[0]).toUpperCase();
}

function ClientsPage() {
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const clientsQuery = useClientsData();
  const projectsQuery = useProjectsData();
  const searchQuery = useSearchData(deferredQuery);

  const isSearching = deferredQuery.length > 0;
  const isLoading = isSearching
    ? searchQuery.isLoading || projectsQuery.isLoading
    : clientsQuery.isLoading || projectsQuery.isLoading;
  const error =
    (isSearching ? searchQuery.error : clientsQuery.error) ||
    projectsQuery.error;
  const visibleClients = isSearching
    ? (searchQuery.data?.clients ?? [])
    : (clientsQuery.data ?? []);
  const matchedProjects = isSearching ? (searchQuery.data?.projects ?? []) : [];
  const projects = projectsQuery.data ?? [];

  const clientsContent = getClientsContent({
    error,
    isLoading,
    isSearching,
    onEdit: setEditingClient,
    visibleClients,
    projects,
  });

  return (
    <AppShell>
      <PageHeader
        actions={
          <div className="flex items-center gap-3">
            <input
              aria-label="Search clients or projects"
              className="h-9 min-w-64 rounded-md border border-border bg-card px-3 text-sm outline-none transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients or projects..."
              value={query}
            />
            <ClientFormDialog
              onOpenChange={setIsCreateOpen}
              open={isCreateOpen}
              trigger={
                <Button className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  New client
                </Button>
              }
            />
          </div>
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
  projects,
}: {
  error: string | null;
  isLoading: boolean;
  isSearching: boolean;
  onEdit: (client: Client) => void;
  visibleClients: Client[];
  projects: Array<{ id: string; clientId: string }>;
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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visibleClients.map((client, index) => {
        const clientProjects = projects.filter((p) => p.clientId === client.id);
        const initials = getInitials(client.name);
        const hasProjects = clientProjects.length > 0;
        const projectPillStyles = hasProjects
          ? "border-primary/15 bg-primary/5 text-primary group-hover:bg-primary/10 group-hover:border-primary/25"
          : "border-border bg-muted/50 text-muted-foreground group-hover:border-primary/10 group-hover:bg-primary/5 group-hover:text-primary";
        return (
          <div
            className="group relative flex animate-slide-up-fade flex-col justify-between gap-5 rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]"
            key={client.id}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="space-y-4">
              {/* Card Header: Avatar + Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 font-bold text-base text-brand-heading transition-all duration-300 group-hover:scale-105 group-hover:border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground">
                  {initials}
                </div>
                <StatusBadge value={client.status} />
              </div>

              {/* Card Body: Details */}
              <div className="space-y-1">
                <Link
                  className="block font-bold text-base text-brand-heading transition-colors duration-200 hover:text-primary"
                  params={{ id: getClientPathParam(client) }}
                  to="/clients/$id"
                >
                  {client.name}
                </Link>
                <div className="flex flex-col text-muted-foreground text-xs">
                  <span>{client.company}</span>
                  <span>{client.email}</span>
                </div>
              </div>
            </div>

            {/* Separator / Footer actions */}
            <div className="mt-5 flex items-center justify-between gap-4 border-border/20 border-t pt-4">
              {/* Projects Pill */}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold text-xs transition-all duration-200",
                  projectPillStyles
                )}
              >
                <HugeiconsIcon className="h-3.5 w-3.5" icon={FolderAddIcon} />
                <span>
                  {clientProjects.length === 1
                    ? "1 project"
                    : `${clientProjects.length} projects`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  className="h-8 text-xs transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                    <Button
                      className="h-8 w-8 transition-transform duration-200 hover:scale-105 active:scale-95"
                      size="icon"
                      type="button"
                      variant="destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matchedProjects.map((project) => (
          <div
            className="group flex flex-col justify-between gap-3 rounded-xl border border-border/40 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_3px_8px_rgba(0,0,0,0.01)]"
            key={project.id}
          >
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-sm transition-colors duration-200 group-hover:text-primary">
                {project.title}
              </p>
              <p className="text-muted-foreground text-xs">
                Deadline: {project.deadline}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <StatusBadge value={project.status} />
            </div>
          </div>
        ))}
      </div>
    </DataSection>
  );
}
