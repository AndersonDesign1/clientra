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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type TabId = "profile" | "features";

const DEFAULT_WORKSPACE_NAME = "Clientra";
const DEFAULT_SUPPORT_EMAIL = "support@clientra.com";

function getPortalPath(workspaceName: string) {
  return (
    workspaceName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "workspace"
  );
}

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
        <div className="mx-auto max-w-3xl space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-96" />
          <div className="grid gap-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (settingsQuery.error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <PageHeader title="Settings" />
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <p className="text-destructive text-sm">
              Failed to load settings. Please try refreshing the page.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
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
      </div>
    </AppShell>
  );
}

// ── Workspace Tab ──────────────────────────────────────────────────────────

function WorkspaceTab() {
  const settingsQuery = useSettingsData();
  const updateMutation = useUpdateSettingsMutation();
  const settings = settingsQuery.data;

  const session = authClient.useSession();
  const currentUser = session.data?.user;

  const [workspaceName, setWorkspaceName] = useState(
    settings?.workspaceName ?? ""
  );
  const [supportEmail, setSupportEmail] = useState(
    settings?.supportEmail ?? ""
  );
  const [copiedPath, setCopiedPath] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  // Is the settings at factory defaults?
  const isDefaultSettings =
    settings &&
    settings.workspaceName === DEFAULT_WORKSPACE_NAME &&
    settings.supportEmail === DEFAULT_SUPPORT_EMAIL;

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      const userName = currentUser?.name;
      const userEmail = currentUser?.email;
      if (isDefaultSettings && (userName || userEmail)) {
        setWorkspaceName(userName ?? "My Workspace");
        setSupportEmail(userEmail ?? DEFAULT_SUPPORT_EMAIL);
      } else {
        setWorkspaceName(settings.workspaceName);
        setSupportEmail(settings.supportEmail);
      }
    }
  }, [settings, isDefaultSettings, currentUser?.name, currentUser?.email]);

  async function handleSave() {
    if (!settings) {
      return;
    }

    setSaveStatus("saving");
    try {
      const portalUrl = `https://useclientra.vercel.app/portal/${portalPath}`;
      await updateMutation.mutateAsync({
        portalUrl,
        supportEmail: supportEmail.trim(),
        workspaceName: workspaceName.trim(),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  const portalPath = getPortalPath(workspaceName);

  async function handleCopyPortalUrl() {
    const url = `https://useclientra.vercel.app/portal/${portalPath}`;
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
    <div className="space-y-6">
      {isDefaultSettings && currentUser && (
        <div className="animate-slide-up-fade rounded-xl border border-primary/25 bg-primary/5 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
          <div className="flex gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Settings01Icon} size={15} />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">
                ✨ Personalize your workspace
              </h4>
              <p className="max-w-2xl text-muted-foreground text-xs leading-relaxed">
                Welcome,{" "}
                <span className="font-semibold text-foreground">
                  {currentUser.name}
                </span>
                ! We noticed your workspace is still using default settings.
                We've pre-filled the profile below with your signup credentials.
                Review the details, customize your brand, and click{" "}
                <span className="font-semibold text-primary">Save Changes</span>{" "}
                to publish your client portal!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Card */}
      <div className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
        {/* Workspace Identity Info Row */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Briefcase01Icon} size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">
              Workspace Profile
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Configure your public branding, customer communication channels,
              and secure shareable client portals.
            </p>
          </div>
        </div>

        <div className="h-px bg-border/45" />

        {/* Workspace Name */}
        <div className="space-y-2">
          <label
            className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider"
            htmlFor="workspace-name"
          >
            Workspace Name
          </label>
          <div className="group/input relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60 transition-colors group-focus-within/input:text-primary">
              <HugeiconsIcon icon={Briefcase01Icon} size={15} />
            </div>
            <input
              className="h-10 w-full rounded-lg border border-border/60 bg-secondary/30 pr-3 pl-10 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="workspace-name"
              onChange={(e) => setWorkspaceName(e.target.value)}
              type="text"
              value={workspaceName}
            />
          </div>
        </div>

        {/* Support Email */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider"
              htmlFor="support-email"
            >
              Support Email
            </label>
            {currentUser?.email && supportEmail !== currentUser.email && (
              <button
                className="cursor-pointer font-medium text-[10px] text-primary transition-all hover:underline focus:outline-none"
                onClick={() => setSupportEmail(currentUser.email ?? "")}
                type="button"
              >
                Use my email ({currentUser.email})
              </button>
            )}
          </div>
          <div className="group/input relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60 transition-colors group-focus-within/input:text-primary">
              <HugeiconsIcon icon={MailOpen02Icon} size={15} />
            </div>
            <input
              className="h-10 w-full rounded-lg border border-border/60 bg-secondary/30 pr-3 pl-10 text-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="support-email"
              onChange={(e) => setSupportEmail(e.target.value)}
              type="email"
              value={supportEmail}
            />
          </div>
        </div>

        {/* Portal URL */}
        <div className="space-y-2">
          <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
            Client Portal URL
          </span>
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/20 p-2.5 pl-3.5 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
            </div>
            <code className="flex-1 select-all font-mono text-muted-foreground text-xs">
              useclientra.vercel.app/portal/
              <span className="font-semibold text-foreground">
                {portalPath}
              </span>
            </code>
            <Button
              className={cn(
                "h-7 gap-1 px-2.5 text-[11px] transition-all",
                copiedPath
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                  : "hover:border-primary/30"
              )}
              onClick={handleCopyPortalUrl}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon
                icon={copiedPath ? Tick02Icon : Copy01Icon}
                size={11}
              />
              <span>{copiedPath ? "Copied!" : "Copy URL"}</span>
            </Button>
          </div>
        </div>

        {/* Workspace Logo Upload (Visual Only) */}
        <div className="space-y-2">
          <span className="block font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
            Workspace Logo
          </span>
          <div className="flex flex-col items-center gap-5 rounded-xl border border-border/40 bg-card p-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] sm:flex-row">
            {/* Exact Logo Card reused from individual project route */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-teal-800 font-bold text-white text-xl shadow-sm ring-4 ring-primary/10 transition-all duration-300 hover:scale-105">
              {workspaceName.slice(0, 2).toUpperCase() || "CL"}
            </div>

            {/* Upload Component re-used from project tabs */}
            <button
              className="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-border/80 border-dashed bg-secondary/15 p-4.5 text-center transition-all duration-300 hover:border-primary/40 hover:bg-secondary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="button"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <HugeiconsIcon icon={Upload01Icon} size={14} />
              </div>
              <p className="mt-2 font-semibold text-foreground text-xs">
                Click here to upload workspace logo
              </p>
              <p className="mt-0.5 max-w-sm text-[10px] text-muted-foreground leading-relaxed">
                PNG, JPG or SVG up to 2MB (Visual Only)
              </p>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 border-border/45 border-t pt-6">
          <Button
            className="h-9 px-4 font-semibold text-sm shadow-sm transition-transform duration-150 active:scale-98"
            disabled={!hasChanges || saveStatus === "saving"}
            onClick={handleSave}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
          {saveStatus === "saved" && (
            <span className="flex animate-bounce-short items-center gap-1 font-semibold text-emerald-600 text-xs">
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
  const [optimisticSettings, setOptimisticSettings] = useState(settings);

  useEffect(() => {
    setOptimisticSettings(settings);
  }, [settings]);

  async function handleToggle(
    key: "allowSignups" | "enableNotifications" | "autoArchive"
  ) {
    if (!optimisticSettings || updateMutation.isPending) {
      return;
    }

    const previousSettings = optimisticSettings;
    const newValue = !optimisticSettings[key];
    setOptimisticSettings({ ...optimisticSettings, [key]: newValue });

    try {
      await updateMutation.mutateAsync({ [key]: newValue });
    } catch (error) {
      console.error("Failed to update feature preference:", error);
      setOptimisticSettings(previousSettings);
    }
  }

  if (!optimisticSettings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
        {/* Workspace Features Info Row */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">
              Workspace Features
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Control active client onboarding behaviors, alert configurations,
              and system cleanups for your workspace.
            </p>
          </div>
        </div>

        <div className="h-px bg-border/45" />

        {/* Toggles Container */}
        <div className="space-y-3.5">
          <FeatureToggle
            checked={optimisticSettings.allowSignups}
            description="Allow new users to sign up without an invitation."
            disabled={updateMutation.isPending}
            icon={UserGroupIcon}
            label="Public Signups"
            onChange={() => handleToggle("allowSignups")}
          />

          <FeatureToggle
            checked={optimisticSettings.enableNotifications}
            description="Send email notifications for project updates and mentions."
            disabled={updateMutation.isPending}
            icon={MailOpen02Icon}
            label="Email Notifications"
            onChange={() => handleToggle("enableNotifications")}
          />

          <FeatureToggle
            checked={optimisticSettings.autoArchive}
            description="Automatically archive completed projects after 90 days."
            disabled={updateMutation.isPending}
            icon={Briefcase01Icon}
            label="Auto-Archive Completed"
            onChange={() => handleToggle("autoArchive")}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureToggle({
  checked,
  disabled = false,
  description,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  description: string;
  icon: typeof UserGroupIcon;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      className="group flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-primary/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onChange}
      type="button"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <HugeiconsIcon icon={icon} size={15} />
        </div>
        <div className="space-y-1">
          <span className="block font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
            {label}
          </span>
          <span className="block max-w-lg text-muted-foreground text-xs leading-relaxed">
            {description}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative h-6 w-11 rounded-full border border-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] transition-all",
          checked ? "border-primary bg-primary" : "border-border/40 bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-all duration-200 ease-out",
            checked
              ? "left-[calc(100%-1.25rem)] scale-100"
              : "left-0.5 scale-90"
          )}
        />
      </div>
    </button>
  );
}
