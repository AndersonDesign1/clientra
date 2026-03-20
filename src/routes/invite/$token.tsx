import { createFileRoute } from "@tanstack/react-router";
import { redirectAuthenticatedUser } from "@/auth/guards";
import { InviteRedeemForm } from "@/components/auth/invite-redeem-form";

export const Route = createFileRoute("/invite/$token")({
  beforeLoad: redirectAuthenticatedUser,
  component: InviteRedeemPage,
});

function InviteRedeemPage() {
  const { token } = Route.useParams();

  return <InviteRedeemForm token={token} />;
}
