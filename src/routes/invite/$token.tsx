import { createFileRoute } from "@tanstack/react-router";
import { getInvitePreview } from "@/auth/bootstrap";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { InviteRedeemForm } from "@/components/auth/invite-redeem-form";

export const Route = createFileRoute("/invite/$token")({
  beforeLoad: redirectAuthenticatedUser,
  loader: ({ params }) => getInvitePreview({ data: { token: params.token } }),
  component: InviteRedeemPage,
});

function InviteRedeemPage() {
  const { token } = Route.useParams();
  const invite = Route.useLoaderData();

  return <InviteRedeemForm initialInvite={invite} token={token} />;
}
