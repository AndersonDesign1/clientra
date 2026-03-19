import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <AppShell>
      <h1 className="mb-4 font-semibold text-2xl">Settings</h1>
      <div className="rounded-xl border bg-white p-4 text-slate-600 text-sm">
        <p>
          Workspace preferences, invite settings, and authentication
          configuration will live here.
        </p>
      </div>
    </AppShell>
  );
}
