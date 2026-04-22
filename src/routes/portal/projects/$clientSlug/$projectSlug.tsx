// biome-ignore-all lint/style/useFilenamingConvention: TanStack route params must be valid JavaScript identifiers.
import { createFileRoute } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { PortalProjectDetailPendingPage } from "@/components/common/route-pending";
import { ensureClientsData, ensureProjectsData } from "@/lib/api";
import { PortalProjectDetailPage } from "@/routes/portal/projects/$id";

export const Route = createFileRoute(
  "/portal/projects/$clientSlug/$projectSlug"
)({
  beforeLoad: requireClientSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: PortalProjectDetailPendingPage,
  component: PortalProjectDetailRoute,
});

function PortalProjectDetailRoute() {
  const { clientSlug, projectSlug } = Route.useParams();

  return (
    <PortalProjectDetailPage
      clientSlug={clientSlug}
      projectSlug={projectSlug}
    />
  );
}
