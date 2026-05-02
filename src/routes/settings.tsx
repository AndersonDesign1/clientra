import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { DataSection, PageHeader } from "@/components/common/product-ui";
import { SettingsPendingPage } from "@/components/common/route-pending";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
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
          <form className="mt-4 space-y-4" onSubmit={handleInviteSubmit}>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">Client</span>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    clientId: event.target.value,
                  }))
                }
                required
                value={formState.clientId}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">Invite email</span>
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
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
            </label>
            {formState.error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
                {formState.error}
              </p>
            ) : null}
            {formState.inviteLink ? (
              <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-900">
                <p className="font-medium">Invite ready</p>
                <p className="mt-1 break-all">{formState.inviteLink}</p>
              </div>
            ) : null}
            <Button
              disabled={formState.isSubmitting || clientsQuery.isLoading}
              type="submit"
            >
              {formState.isSubmitting
                ? "Creating invite..."
                : "Generate invite link"}
            </Button>
          </form>
        </DataSection>
        <DataSection className="text-slate-600 text-sm" title="OAuth setup">
          <ul className="space-y-2 leading-6">
            <li>
              Google local: `http://localhost:3000/api/auth/callback/google`
            </li>
            <li>
              Google production:
              `https://useclientra.vercel.app/api/auth/callback/google`
            </li>
            <li>
              GitHub local: `http://localhost:3000/api/auth/callback/github`
            </li>
            <li>
              GitHub production:
              `https://useclientra.vercel.app/api/auth/callback/github`
            </li>
          </ul>
        </DataSection>
      </div>
    </AppShell>
  );
}
