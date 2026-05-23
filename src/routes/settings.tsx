import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { DataSection, PageHeader } from "@/components/common/product-ui";
import { SettingsPendingPage } from "@/components/common/route-pending";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ensureClientsData, useClientsData } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => ensureClientsData(context.queryClient),
  pendingComponent: SettingsPendingPage,
  component: SettingsPage,
});

interface InviteFormState {
  clientId: string;
  email: string;
  error: string | null;
  inviteLink: string | null;
  isSubmitting: boolean;
}

function SettingsPage() {
  const clientsQuery = useClientsData();
  const [formState, setFormState] = useState<InviteFormState>({
    clientId: "",
    email: "",
    error: null,
    inviteLink: null,
    isSubmitting: false,
  });
  const clients = clientsQuery.data ?? [];

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState((current) => ({
      ...current,
      error: null,
      inviteLink: null,
      isSubmitting: true,
    }));

    try {
      const response = await fetch("/api/invites", {
        body: JSON.stringify({
          clientId: formState.clientId,
          email: formState.email,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        inviteLink?: string;
      } | null;

      if (!(response.ok && data?.inviteLink)) {
        setFormState((current) => ({
          ...current,
          error: data?.error ?? "Unable to create invite.",
          isSubmitting: false,
        }));
        return;
      }

      setFormState((current) => ({
        ...current,
        email: "",
        inviteLink: data.inviteLink ?? null,
        isSubmitting: false,
      }));
    } catch {
      setFormState((current) => ({
        ...current,
        error: "Network error creating invite.",
        isSubmitting: false,
      }));
    }
  }

  return (
    <AppShell>
      <PageHeader
        description="Invite clients and keep callback configuration close at hand."
        title="Settings"
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DataSection
          description="Invite clients into their portal without opening public signup. Each invite stays active for seven days."
          title="Client access invites"
        >
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <form className="space-y-5" onSubmit={handleInviteSubmit}>
              <div className="space-y-2">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Client
                </Label>
                <Select
                  onValueChange={(val) =>
                    setFormState((current) => ({
                      ...current,
                      clientId: val ?? "",
                    }))
                  }
                  required
                  value={formState.clientId}
                >
                  <SelectTrigger className="h-10 w-full border-border/40 bg-background font-semibold text-[11px] uppercase tracking-wider">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem
                        className="font-semibold text-[11px] uppercase tracking-wider"
                        key={client.id}
                        value={client.id}
                      >
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Invite email
                </Label>
                <Input
                  className="h-10 w-full border-border/40 bg-background text-sm focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:ring-offset-0"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="client@example.com"
                  required
                  type="email"
                  value={formState.email}
                />
              </div>

              {formState.error ? (
                <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 px-4 py-2.5 font-semibold text-rose-700 text-xs dark:text-rose-400">
                  {formState.error}
                </p>
              ) : null}

              {formState.inviteLink ? (
                <div className="rounded-lg border border-teal-200/50 bg-teal-50/10 px-4 py-3.5 text-sm text-teal-800 dark:text-teal-400">
                  <p className="font-bold text-xs uppercase tracking-wider">
                    Invite ready
                  </p>
                  <p className="mt-1.5 select-all break-all rounded-md border border-border/10 bg-background/50 p-2.5 font-mono text-xs leading-normal">
                    {formState.inviteLink}
                  </p>
                </div>
              ) : null}

              <Button
                className="w-full font-bold transition-transform duration-150 active:scale-[0.98]"
                disabled={formState.isSubmitting || clientsQuery.isLoading}
                type="submit"
              >
                {formState.isSubmitting
                  ? "Creating invite..."
                  : "Generate invite link"}
              </Button>
            </form>
          </div>
        </DataSection>
        <DataSection
          className="text-muted-foreground text-xs leading-relaxed"
          title="OAuth setup"
        >
          <div className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
            <p className="mb-4 border-border/40 border-b pb-3 font-medium text-foreground text-sm">
              Callback Configurations
            </p>
            <ul className="space-y-4">
              <li className="space-y-1.5">
                <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Google local
                </span>
                <code className="block select-all break-all rounded-lg border border-border/10 bg-secondary/15 px-3 py-2 font-mono text-[11px] text-foreground">
                  http://localhost:3000/api/auth/callback/google
                </code>
              </li>
              <li className="space-y-1.5">
                <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Google production
                </span>
                <code className="block select-all break-all rounded-lg border border-border/10 bg-secondary/15 px-3 py-2 font-mono text-[11px] text-foreground">
                  https://useclientra.vercel.app/api/auth/callback/google
                </code>
              </li>
              <li className="space-y-1.5">
                <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  GitHub local
                </span>
                <code className="block select-all break-all rounded-lg border border-border/10 bg-secondary/15 px-3 py-2 font-mono text-[11px] text-foreground">
                  http://localhost:3000/api/auth/callback/github
                </code>
              </li>
              <li className="space-y-1.5">
                <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                  GitHub production
                </span>
                <code className="block select-all break-all rounded-lg border border-border/10 bg-secondary/15 px-3 py-2 font-mono text-[11px] text-foreground">
                  https://useclientra.vercel.app/api/auth/callback/github
                </code>
              </li>
            </ul>
          </div>
        </DataSection>
      </div>
    </AppShell>
  );
}
