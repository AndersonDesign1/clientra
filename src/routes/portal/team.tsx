import {
  Mail01Icon,
  UserAddIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireClientSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ensurePortalTeamData,
  useCreatePortalInviteMutation,
  usePortalTeamData,
} from "@/lib/api";

export const Route = createFileRoute("/portal/team")({
  beforeLoad: requireClientSession,
  loader: ({ context }) => ensurePortalTeamData(context.queryClient),
  component: PortalTeamPage,
});

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inviteMutation = useCreatePortalInviteMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    try {
      await inviteMutation.mutateAsync(email.trim());
      setEmail("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="gap-1.5 text-xs" size="sm">
            <HugeiconsIcon icon={UserAddIcon} size={13} />
            Invite Colleague
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a colleague</DialogTitle>
          <DialogDescription>
            Send an invite link to a colleague so they can access this client
            portal. The invite will be sent by email once an admin approves the
            request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                type="email"
                value={email}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 px-2.5 py-1.5 text-rose-600 text-xs">
                {error}
              </p>
            )}
            <div className="rounded-lg border border-amber-200/50 bg-amber-50/10 px-3 py-2.5 text-amber-700 text-xs dark:text-amber-400">
              <strong>Note:</strong> Your invite request will be reviewed by an
              administrator and sent to the recipient once approved.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={inviteMutation.isPending} type="submit">
              {inviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PortalTeamPage() {
  const teamQuery = usePortalTeamData();
  const team = teamQuery.data;

  return (
    <PortalShell>
      <PageHeader
        actions={<InviteDialog />}
        description="Colleagues who have access to this client portal."
        title="Team"
      />

      {teamQuery.isLoading && (
        <LoadingPanel
          description="Fetching your team members…"
          title="Loading team"
        />
      )}
      {!teamQuery.isLoading && teamQuery.error && (
        <ErrorPanel description={teamQuery.error} />
      )}

      {team && (
        <div className="space-y-6">
          {/* Active Members */}
          <section className="animate-slide-up-fade rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  className="text-primary"
                  icon={UserGroupIcon}
                  size={15}
                />
                <h2 className="font-semibold text-foreground text-sm">
                  Active Members
                </h2>
                <Badge className="text-[10px]" variant="outline">
                  {team.members.length}
                </Badge>
              </div>
            </div>

            {team.members.length === 0 ? (
              <EmptyPanel
                description="Invite colleagues using the button above."
                title="No team members yet"
              />
            ) : (
              <div className="divide-y divide-border/20">
                {team.members.map((member) => (
                  <div
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    key={member.id}
                  >
                    <Avatar className="h-9 w-9">
                      {member.image && (
                        <AvatarImage alt={member.name} src={member.image} />
                      )}
                      <AvatarFallback className="border border-border bg-card font-bold text-foreground text-xs">
                        {member.name[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground text-sm">
                        {member.name}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="bg-secondary/30 text-[10px] capitalize"
                        variant="outline"
                      >
                        <HugeiconsIcon
                          className="mr-1"
                          icon={UserIcon}
                          size={9}
                        />
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Invites */}
          {team.pendingInvites.length > 0 && (
            <section className="animate-slide-up-fade rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
              <div className="mb-4 flex items-center gap-2">
                <HugeiconsIcon
                  className="text-amber-500"
                  icon={Mail01Icon}
                  size={15}
                />
                <h2 className="font-semibold text-foreground text-sm">
                  Pending Invites
                </h2>
                <Badge className="text-[10px]" variant="outline">
                  {team.pendingInvites.length}
                </Badge>
              </div>

              <div className="divide-y divide-border/20">
                {team.pendingInvites.map((invite) => (
                  <div
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    key={invite.id}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/60 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                      <HugeiconsIcon
                        className="text-amber-600"
                        icon={Mail01Icon}
                        size={14}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground text-sm">
                        {invite.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Invited{" "}
                        {new Date(invite.createdAt).toLocaleDateString()} ·
                        Expires{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className="border-amber-200/60 bg-amber-50/50 text-[10px] text-amber-600 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400"
                      variant="outline"
                    >
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PortalShell>
  );
}
