import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/auth/guards";
import { ErrorPanel, LoadingPanel } from "@/components/common/state-panel";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { useClientsData } from "@/lib/api";

export const Route = createFileRoute("/clients/$id")({
  beforeLoad: requireAdminSession,
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { id } = Route.useParams();
  const clientsQuery = useClientsData();

  if (clientsQuery.isLoading) {
    return (
      <AppShell>
        <LoadingPanel />
      </AppShell>
    );
  }

  if (clientsQuery.error) {
    return (
      <AppShell>
        <ErrorPanel description={clientsQuery.error} />
      </AppShell>
    );
  }

  const client = clientsQuery.data?.find((entry) => entry.id === id);

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

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-semibold text-2xl">{client.company}</h1>
        <StatusBadge value={client.status} />
      </div>
      <div className="space-y-3 rounded-xl border bg-white p-4 text-sm">
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
    </AppShell>
  );
}
