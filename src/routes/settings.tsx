import {
  Briefcase01Icon,
  Copy01Icon,
  MailOpen02Icon,
  Settings01Icon,
  Tick02Icon,
  Upload01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAdminSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import { SettingsPendingPage } from "@/components/common/route-pending";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ensureSettingsData,
  useSettingsData,
  useUpdateSettingsMutation,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type TabId = "profile" | "features";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAdminSession,
  loader: ({ context }) => ensureSettingsData(context.queryClient),
  pendingComponent: SettingsPendingPage,
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const settingsQuery = useSettingsData();

  if (settingsQuery.isLoading) {
    return (
      <AppShell>
        <div className="space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-96" />
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (settingsQuery.error) {
    return (
      <AppShell>
        <PageHeader title="Settings" />
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-destructive text-sm">
            Failed to load settings. Please try refreshing the page.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        description="Manage your workspace branding, preferences, and configuration."
        title="Settings"
      />

      {/* Tab Navigation - matches project detail pattern */}
      <div className="mb-6 flex flex-wrap gap-6 border-border/40 border-b pb-px">
        {[
          {
            id: "profile",
            label: "Workspace",
            icon: Briefcase01Icon,
          },
          { id: "features", label: "Features", icon: Settings01Icon },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              className={cn(
                "flex select-none items-center gap-1.5 border-b-2 px-1 pt-1.5 pb-3 font-bold text-[11px] uppercase tracking-wider transition-all duration-250",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              type="button"
            >
              <HugeiconsIcon className="h-3.5 w-3.5" icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-50 animate-slide-up-fade">
        {activeTab === "profile" && <WorkspaceTab />}
        {activeTab === "features" && <FeaturesTab />}
      </div>
    </AppShell>
  );
}



// ── Workspace Tab ──────────────────────────────────────────────────────────

function WorkspaceTab() {
  const settingsQuery = useSettingsData();
  const updateMutation = useUpdateSettingsMutation();
  const settings = settingsQuery.data;

  const [workspaceName, setWorkspaceName] = useState(settings?.workspaceName ?? "");
  const [supportEmail, setSupportEmail] = useState(settings?.supportEmail ?? "");
  const [copiedPath, setCopiedPath] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setWorkspaceName(settings.workspaceName);
      setSupportEmail(settings.supportEmail);
    }
  }, [settings]);

  async function handleSave() {
    if (!settings) return;

    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync({
        workspaceName: workspaceName.trim(),
        supportEmail: supportEmail.trim(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  const portalPath = workspaceName.toLowerCase().replace(/\s+/g, "-") || "workspace";

  async function handleCopyPortalUrl() {
    const url = `https://useclientra.com/portal/${portalPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  const hasChanges =
    settings &&
    (workspaceName.trim() !== settings.workspaceName ||
      supportEmail.trim() !== settings.supportEmail);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Workspace Identity</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Configure how your workspace appears to clients and team members.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl space-y-6">
        {/* Workspace Name */}
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="workspace-name">
            Workspace Name
          </label>
          <input
            className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
            id="workspace-name"
            onChange={(e) => setWorkspaceName(e.target.value)}
            type="text"
            value={workspaceName}
          />
        </div>

        {/* Support Email */}
        <div className="space-y-2">
          <label className="font-medium text-sm" htmlFor="support-email">
            Support Email
          </label>
          <input
            className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
            id="support-email"
            onChange={(e) => setSupportEmail(e.target.value)}
            type="email"
            value={supportEmail}
          />
        </div>

        {/* Portal URL */}
        <div className="space-y-2">
          <span className="font-medium text-sm">Client Portal URL</span>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 p-3">
            <code className="flex-1 text-sm text-muted-foreground">
              useclientra.com/portal/{portalPath}
            </code>
            <Button
              className={cn(
                "h-7 px-2 text-xs",
                copiedPath && "text-emerald-600"
              )}
              onClick={handleCopyPortalUrl}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon
                icon={copiedPath ? Tick02Icon : Copy01Icon}
                size={12}
              />
              {copiedPath ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Logo Upload (Visual Only) */}
        <div className="space-y-2">
          <span className="font-medium text-sm">Workspace Logo</span>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 font-bold text-white text-lg">
              {workspaceName.slice(0, 2).toUpperCase() || "CL"}
            </div>
            <Button className="h-8 text-xs" size="sm" variant="outline">
              <HugeiconsIcon icon={Upload01Icon} size={12} />
              Upload Logo
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            className="h-9 px-4 text-sm"
            disabled={!hasChanges || saveStatus === "saving"}
            onClick={handleSave}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-600 text-xs">
              <HugeiconsIcon icon={Tick02Icon} size={12} />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Features Tab ───────────────────────────────────────────────────────────

function FeaturesTab() {
  const settingsQuery = useSettingsData();
  const updateMutation = useUpdateSettingsMutation();
  const settings = settingsQuery.data;

  async function handleToggle(key: "allowSignups" | "enableNotifications" | "autoArchive") {
    if (!settings) return;

    const newValue = !settings[key];
    await updateMutation.mutateAsync({ [key]: newValue });
  }

  if (!settings) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Feature Preferences</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Control workspace features and default behaviors.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl space-y-4">
        <FeatureToggle
          checked={settings.allowSignups}
          description="Allow new users to sign up without an invitation."
          icon={UserGroupIcon}
          label="Public Signups"
          onChange={() => handleToggle("allowSignups")}
        />

        <FeatureToggle
          checked={settings.enableNotifications}
          description="Send email notifications for project updates and mentions."
          icon={MailOpen02Icon}
          label="Email Notifications"
          onChange={() => handleToggle("enableNotifications")}
        />

        <FeatureToggle
          checked={settings.autoArchive}
          description="Automatically archive completed projects after 90 days."
          icon={Briefcase01Icon}
          label="Auto-Archive Completed"
          onChange={() => handleToggle("autoArchive")}
        />
      </div>
    </div>
  );
}

function FeatureToggle({
  checked,
  description,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  icon: typeof UserGroupIcon;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      className="group flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-primary/20"
      onClick={onChange}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} size={14} />
        </div>
        <div className="space-y-1">
          <span className="block font-medium text-sm">{label}</span>
          <span className="block text-muted-foreground text-xs">
            {description}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative h-6 w-11 rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "left-[calc(100%-1.125rem)]" : "left-0.5"
          )}
        />
      </div>
    </button>
  );
}
