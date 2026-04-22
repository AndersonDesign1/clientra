// biome-ignore-all lint/style/useFilenamingConvention: TanStack route params must be valid JavaScript identifiers.
import { createFileRoute } from "@tanstack/react-router";
import { requireAdminSession } from "@/auth/guards";
import { ProjectDetailPendingPage } from "@/components/common/route-pending";
import { ensureClientsData, ensureProjectsData } from "@/lib/api";
import { AdminProjectDetailPage } from "@/routes/projects/$id";

export const Route = createFileRoute("/projects/$clientSlug/$projectSlug")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) =>
    Promise.all([
      ensureClientsData(context.queryClient),
      ensureProjectsData(context.queryClient),
    ]),
  pendingComponent: ProjectDetailPendingPage,
  component: AdminProjectDetailRoute,
});

function AdminProjectDetailRoute() {
  const { clientSlug, projectSlug } = Route.useParams();

  return (
    <AdminProjectDetailPage clientSlug={clientSlug} projectSlug={projectSlug} />
  );
}
