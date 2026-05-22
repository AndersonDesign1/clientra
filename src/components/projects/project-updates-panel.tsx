import {
  Calendar01Icon,
  Delete02Icon,
  PencilIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type FormEvent, useState } from "react";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  if (updates.length === 0) {
    return (
      <EmptyPanel
        description="Publish concise status reports so clients can quickly understand progress."
        title="No project updates yet"
      />
    );
  }

  // Sort updates by createdAt descending (latest first)
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative ml-3.5 space-y-2 border-border/25 border-l pl-6.5">
      {sortedUpdates.map((update) => {
        let dotColor =
          "border-emerald-500 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20";
        if (update.status === "at_risk") {
          dotColor =
            "border-amber-500 bg-amber-50 text-amber-500 dark:bg-amber-950/20";
        } else if (update.status === "blocked") {
          dotColor =
            "border-rose-500 bg-rose-50 text-rose-500 dark:bg-rose-950/20";
        }

        return (
          <div
            className="group relative animate-slide-up-fade rounded-lg p-2.5 transition-colors duration-200 hover:bg-secondary/15"
            key={update.id}
          >
            {/* Timeline Dot Indicator */}
            <div
              className={cn(
                "absolute top-4 -left-[32px] flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background ring-4 ring-background transition-all duration-300",
                dotColor
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  update.status === "on_track" || update.status === "complete"
                    ? "bg-emerald-500"
                    : update.status === "at_risk"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                )}
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-[#08361f] dark:text-foreground text-sm leading-tight">
                    {update.title}
                  </span>
                  <Badge
                    className={cn(
                      "rounded px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
                      getUpdateStatusBadgeStyles(update.status)
                    )}
                    variant={null}
                  >
                    {formatProjectUpdateStatus(update.status)}
                  </Badge>
                  <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-muted-foreground uppercase tracking-wider">
                    <HugeiconsIcon icon={Calendar01Icon} size={9} />
                    {new Date(update.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="max-w-2xl whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
                  {update.body}
                </p>

                <p className="font-semibold text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                  Published by {update.authorName}
                </p>
              </div>

              {canManage ? (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 self-center">
                  <Button
                    className="h-7 w-7 p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => onEdit(update)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <HugeiconsIcon icon={PencilIcon} size={11} />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    className="h-7 w-7 p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => onDelete(update)}
                    size="icon"
                    type="button"
                    variant="destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={11} />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
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
      className="animate-slide-up-fade space-y-4 rounded-xl border border-border/60 bg-secondary/15 p-5 shadow-sm"
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
      <div className="flex justify-end gap-2 border-border/40 border-t pt-1">
        {onCancel ? (
          <Button onClick={onCancel} size="sm" type="button" variant="outline">
            Cancel
          </Button>
        ) : null}
        <Button disabled={isPending} size="sm" type="submit">
          {submitLabel}
        </Button>
      </div>
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2 className="animate-slide-up-fade font-semibold text-foreground text-base">
            Project Updates
          </h2>
          <p className="mt-1 animate-slide-up-fade text-muted-foreground text-xs leading-relaxed">
            Concise status reports outlining recent progress and forward plans.
          </p>
        </div>
      </div>
      {canManage ? (
        <div className="space-y-4">
          {editingUpdate ? (
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
          ) : (
            <ProjectUpdateForm
              error={createUpdate.error?.message ?? null}
              isPending={createUpdate.isPending}
              onSubmit={async (input) => {
                await createUpdate.mutateAsync({
                  input,
                  projectId,
                });
              }}
            />
          )}
        </div>
      ) : null}
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
