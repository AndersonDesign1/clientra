import { type FormEvent, useState } from "react";
import { UnifiedActivityList } from "@/components/common/activity-list";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ProjectUpdate,
  type ProjectUpdatePayload,
  type ProjectUpdateStatus,
  useCreateProjectUpdateMutation,
  useDeleteProjectUpdateMutation,
  useProjectUpdatesData,
  useUpdateProjectUpdateMutation,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const UPDATE_STATUS_OPTIONS = [
  { label: "On track", value: "on_track" },
  { label: "At risk", value: "at_risk" },
  { label: "Blocked", value: "blocked" },
  { label: "Complete", value: "complete" },
] as const;

interface ProjectUpdatesPanelProps {
  canManage: boolean;
  projectId: string;
}

interface UpdateFormState {
  body: string;
  status: ProjectUpdateStatus;
  title: string;
}

function getInitialState(update?: ProjectUpdate): UpdateFormState {
  return {
    body: update?.body ?? "",
    status: update?.status ?? "on_track",
    title: update?.title ?? "",
  };
}

function toUpdatePayload(state: UpdateFormState): ProjectUpdatePayload {
  return {
    body: state.body.trim(),
    status: state.status,
    title: state.title.trim(),
  };
}

export function formatProjectUpdateStatus(status: ProjectUpdateStatus) {
  return (
    UPDATE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Update"
  );
}

function getUpdateStatusBadgeStyles(status: ProjectUpdateStatus) {
  if (status === "on_track") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
  if (status === "at_risk") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
  if (status === "blocked") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
  }
  return "bg-secondary/40 text-muted-foreground border-border/40";
}

export function ProjectUpdateList({
  canManage,
  onDelete,
  onEdit,
  updates,
}: {
  canManage: boolean;
  onDelete: (update: ProjectUpdate) => void;
  onEdit: (update: ProjectUpdate) => void;
  updates: ProjectUpdate[];
}) {
  // Sort updates by createdAt descending (latest first)
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const items = sortedUpdates.map((update) => {
    let dotBg = "bg-emerald-50 dark:bg-emerald-950/20";
    let dotColor =
      "text-emerald-500 border-emerald-200 dark:border-emerald-900";

    if (update.status === "at_risk") {
      dotBg = "bg-amber-50 dark:bg-amber-950/20";
      dotColor = "text-amber-500 border-amber-200 dark:border-amber-900";
    } else if (update.status === "blocked") {
      dotBg = "bg-rose-50 dark:bg-rose-950/20";
      dotColor = "text-rose-500 border-rose-200 dark:border-rose-900";
    }

    let dotInnerBg = "bg-rose-500";
    if (update.status === "on_track" || update.status === "complete") {
      dotInnerBg = "bg-emerald-500";
    } else if (update.status === "at_risk") {
      dotInnerBg = "bg-amber-500";
    }

    return {
      id: update.id,
      iconBgClass: dotBg,
      iconColorClass: dotColor,
      dotInnerBgClass: dotInnerBg,
      title: update.title,
      titleClass:
        "font-bold text-[#08361f] text-xs leading-tight dark:text-foreground",
      badge: (
        <Badge
          className={cn(
            "rounded px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
            getUpdateStatusBadgeStyles(update.status)
          )}
          variant={null}
        >
          {formatProjectUpdateStatus(update.status)}
        </Badge>
      ),
      body: update.body,
      footer: `Published by ${update.authorName}`,
      time: new Date(update.createdAt).toLocaleDateString(),
      canManage,
      onEdit,
      onDelete,
      rawItem: update,
    };
  });

  return (
    <UnifiedActivityList
      emptyState={
        <EmptyPanel
          description="Publish concise status reports so clients can quickly understand progress."
          title="No project updates yet"
        />
      }
      items={items}
    />
  );
}

function ProjectUpdateForm({
  error,
  initialUpdate,
  isPending,
  onCancel,
  onSubmit,
}: {
  error: string | null;
  initialUpdate?: ProjectUpdate;
  isPending: boolean;
  onCancel?: () => void;
  onSubmit: (payload: ProjectUpdatePayload) => Promise<void>;
}) {
  const [state, setState] = useState(() => getInitialState(initialUpdate));
  const [formError, setFormError] = useState<string | null>(null);
  let submitLabel = "Publish Update";

  if (initialUpdate) {
    submitLabel = "Save Update";
  }

  if (isPending) {
    submitLabel = "Saving...";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toUpdatePayload(state);

    if (!(payload.title && payload.body)) {
      setFormError("Add a title and update body before publishing.");
      return;
    }

    setFormError(null);
    await onSubmit(payload);

    if (!initialUpdate) {
      setState(getInitialState());
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-12">
        <label className="grid gap-1.5 sm:col-span-8">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Title
          </span>
          <input
            className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="e.g. Completed Sprint 2 Review & Milestones"
            value={state.title}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-4">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Project Status Accent
          </span>
          <select
            className="h-[38px] rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                status: event.target.value as ProjectUpdateStatus,
              }))
            }
            value={state.status}
          >
            {UPDATE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5">
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Update Description
        </span>
        <textarea
          className="min-h-[110px] rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
          onChange={(event) =>
            setState((current) => ({
              ...current,
              body: event.target.value,
            }))
          }
          placeholder="Describe completed works, ongoing focus, or blockages..."
          value={state.body}
        />
      </label>
      {formError || error ? (
        <p className="animate-slide-up-fade rounded-lg border border-rose-200/50 bg-rose-50/10 p-3 text-rose-700 text-xs">
          {formError ?? error}
        </p>
      ) : null}
      <DialogFooter>
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
        ) : null}
        <Button
          className="transition-transform hover:scale-[1.01] active:scale-[0.99]"
          disabled={isPending}
          type="submit"
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectUpdatesPanel({
  canManage,
  projectId,
}: ProjectUpdatesPanelProps) {
  const updatesQuery = useProjectUpdatesData(projectId);
  const createUpdate = useCreateProjectUpdateMutation();
  const updateUpdate = useUpdateProjectUpdateMutation();
  const deleteUpdate = useDeleteProjectUpdateMutation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProjectUpdate | null>(
    null
  );

  if (updatesQuery.isLoading && !updatesQuery.data) {
    return (
      <div className="py-4">
        <LoadingPanel
          description="Loading project updates."
          title="Loading updates"
        />
      </div>
    );
  }

  if (updatesQuery.error && !updatesQuery.data) {
    return <ErrorPanel description={updatesQuery.error} />;
  }

  const updates = updatesQuery.data ?? [];

  return (
    <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">
            Project Updates
          </h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Concise status reports outlining recent progress and forward plans.
          </p>
        </div>
        {canManage && (
          <Button
            className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setIsAddOpen(true)}
            size="sm"
          >
            Publish Update
          </Button>
        )}
      </div>

      {/* Add Update Dialog */}
      {canManage && (
        <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Publish Update</DialogTitle>
              <DialogDescription>
                Publish a new status report for this project to share with
                clients.
              </DialogDescription>
            </DialogHeader>
            <ProjectUpdateForm
              error={createUpdate.error?.message ?? null}
              isPending={createUpdate.isPending}
              onCancel={() => setIsAddOpen(false)}
              onSubmit={async (input) => {
                await createUpdate.mutateAsync({
                  input,
                  projectId,
                });
                setIsAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Update Dialog */}
      {canManage && (
        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setEditingUpdate(null);
            }
          }}
          open={Boolean(editingUpdate)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Update</DialogTitle>
              <DialogDescription>
                Update the details or status accent of this status report.
              </DialogDescription>
            </DialogHeader>
            {editingUpdate && (
              <ProjectUpdateForm
                error={updateUpdate.error?.message ?? null}
                initialUpdate={editingUpdate}
                isPending={updateUpdate.isPending}
                onCancel={() => setEditingUpdate(null)}
                onSubmit={async (input) => {
                  await updateUpdate.mutateAsync({
                    id: editingUpdate.id,
                    input,
                  });
                  setEditingUpdate(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      <ProjectUpdateList
        canManage={canManage}
        onDelete={(update) => {
          deleteUpdate
            .mutateAsync({ id: update.id, projectId })
            .catch(() => undefined);
        }}
        onEdit={setEditingUpdate}
        updates={updates}
      />
      {deleteUpdate.error ? (
        <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-3 text-rose-700 text-sm">
          {deleteUpdate.error.message}
        </p>
      ) : null}
    </section>
  );
}
