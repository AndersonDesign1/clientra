import { createFileRoute } from "@tanstack/react-router";
import { WorkerInviteForm } from "@/components/auth/worker-invite-form";

export const Route = createFileRoute("/invite/worker/$token")({
  component: WorkerInvitePage,
});

function WorkerInvitePage() {
  const { token } = Route.useParams();

  return <WorkerInviteForm token={token} />;
}
