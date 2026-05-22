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
  type ProjectMilestone,
  type ProjectMilestonePayload,
  type ProjectMilestoneStatus,
  useCreateProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  useProjectMilestonesData,
  useUpdateProjectMilestoneMutation,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const MILESTONE_STATUS_OPTIONS = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
] as const;

function getInitialState(milestone?: ProjectMilestone) {
  return {
    description: milestone?.description ?? "",
    dueDate: milestone?.dueDate ?? "",
    sortOrder: String(milestone?.sortOrder ?? 0),
    status: milestone?.status ?? ("todo" as ProjectMilestoneStatus),
    title: milestone?.title ?? "",
  };
}

function toMilestonePayload(
  state: ReturnType<typeof getInitialState>
): ProjectMilestonePayload {
  const sortOrder = Number(state.sortOrder);

  return {
    description: optionalString(state.description),
    dueDate: optionalString(state.dueDate),
    sortOrder: Number.isInteger(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
    status: state.status,
    title: state.title.trim(),
  };
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function formatMilestoneStatus(status: ProjectMilestoneStatus) {
  return (
    MILESTONE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Milestone"
  );
}

function getStatusBadgeStyles(status: ProjectMilestoneStatus) {
  if (status === "done") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }

  if (status === "in_progress") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }

  return "bg-secondary/40 text-muted-foreground border-border/40";
}

export function ProjectMilestoneList({
  canManage,
  milestones,
  onDelete,
  onEdit,
}: {
  canManage: boolean;
  milestones: ProjectMilestone[];
  onDelete: (milestone: ProjectMilestone) => void;
  onEdit: (milestone: ProjectMilestone) => void;
}) {
  if (milestones.length === 0) {
    return (
      <EmptyPanel
        description="Add lightweight deliverables so clients can see what is planned, active, and complete."
        title="No milestones yet"
      />
    );
  }

  // Sort milestones by sortOrder then updatedAt
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="relative ml-3.5 space-y-2 border-border/25 border-l pl-6.5">
      {sortedMilestones.map((milestone) => {
        const isDone = milestone.status === "done";
        const isInProgress = milestone.status === "in_progress";

        return (
          <div
            className="group relative animate-slide-up-fade rounded-lg p-2.5 transition-colors duration-200 hover:bg-secondary/15"
            key={milestone.id}
          >
            {/* Timeline Dot Connector */}
            <div
              className={cn(
                "absolute top-4 -left-[32px] flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background ring-4 ring-background transition-all duration-300",
                isDone
                  ? "border-emerald-500 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20"
                  : isInProgress
                    ? "animate-pulse border-amber-500 bg-amber-50 text-amber-500 dark:bg-amber-950/20"
                    : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {isDone ? (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ) : isInProgress ? (
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
              )}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={cn(
                    "font-bold text-sm leading-tight transition-colors",
                    isDone ? "text-muted-foreground/80 line-through font-medium" : "text-[#08361f] dark:text-foreground"
                  )}>
                    {milestone.title}
                  </span>
                  <Badge
                    className={cn(
                      "rounded px-1.5 py-0.5 font-bold text-[8px] uppercase tracking-wider",
                      getStatusBadgeStyles(milestone.status)
                    )}
                    variant={null}
                  >
                    {formatMilestoneStatus(milestone.status)}
                  </Badge>
                  {milestone.dueDate ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[9px] text-muted-foreground uppercase tracking-wider">
                      <HugeiconsIcon icon={Calendar01Icon} size={9} />
                      Due {milestone.dueDate}
                    </span>
                  ) : null}
                </div>

                {milestone.description ? (
                  <p className="max-w-2xl whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
                    {milestone.description}
                  </p>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 self-center">
                  <Button
                    className="h-7 w-7 p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => onEdit(milestone)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <HugeiconsIcon icon={PencilIcon} size={11} />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    className="h-7 w-7 p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => onDelete(milestone)}
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

function ProjectMilestoneForm({
  error,
  initialMilestone,
  isPending,
  onCancel,
  onSubmit,
}: {
  error: string | null;
  initialMilestone?: ProjectMilestone;
  isPending: boolean;
  onCancel?: () => void;
  onSubmit: (payload: ProjectMilestonePayload) => Promise<void>;
}) {
  const [state, setState] = useState(() => getInitialState(initialMilestone));
  const [formError, setFormError] = useState<string | null>(null);
  let submitLabel = "Add Milestone";

  if (initialMilestone) {
    submitLabel = "Save Milestone";
  }

  if (isPending) {
    submitLabel = "Saving...";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toMilestonePayload(state);

    if (!payload.title) {
      setFormError("Add a milestone title before saving.");
      return;
    }

    setFormError(null);
    await onSubmit(payload);

    if (!initialMilestone) {
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
        <label className="grid gap-1.5 sm:col-span-6">
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
            placeholder="e.g. Design Hand-off"
            value={state.title}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-4">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Status
          </span>
          <select
            className="h-[38px] rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                status: event.target.value as ProjectMilestoneStatus,
              }))
            }
            value={state.status}
          >
            {MILESTONE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Order
          </span>
          <input
            className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            min="0"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                sortOrder: event.target.value,
              }))
            }
            type="number"
            value={state.sortOrder}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-12">
        <label className="grid gap-1.5 sm:col-span-8">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Description
          </span>
          <textarea
            className="min-h-[80px] rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Add deliverables details or milestone description..."
            value={state.description}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-4">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Due date
          </span>
          <input
            className="h-[80px] rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/10 sm:h-auto"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            type="date"
            value={state.dueDate}
          />
        </label>
      </div>
      {formError || error ? (
        <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-3 text-rose-700 text-xs">
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

export function ProjectMilestonesPanel({
  canManage,
  projectId,
}: {
  canManage: boolean;
  projectId: string;
}) {
  const milestonesQuery = useProjectMilestonesData(projectId);
  const createMilestone = useCreateProjectMilestoneMutation();
  const updateMilestone = useUpdateProjectMilestoneMutation();
  const deleteMilestone = useDeleteProjectMilestoneMutation();
  const [editingMilestone, setEditingMilestone] =
    useState<ProjectMilestone | null>(null);

  if (milestonesQuery.isLoading && !milestonesQuery.data) {
    return (
      <div className="py-4">
        <LoadingPanel
          description="Loading project milestones."
          title="Loading milestones"
        />
      </div>
    );
  }

  if (milestonesQuery.error && !milestonesQuery.data) {
    return <ErrorPanel description={milestonesQuery.error} />;
  }

  const milestones = milestonesQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">
            Project Milestones
          </h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Track key deliverables and deadlines for maximum transparency.
          </p>
        </div>
      </div>
      {canManage ? (
        <div className="space-y-4">
          {editingMilestone ? (
            <ProjectMilestoneForm
              error={updateMilestone.error?.message ?? null}
              initialMilestone={editingMilestone}
              isPending={updateMilestone.isPending}
              onCancel={() => setEditingMilestone(null)}
              onSubmit={async (input) => {
                await updateMilestone.mutateAsync({
                  id: editingMilestone.id,
                  input,
                });
                setEditingMilestone(null);
              }}
            />
          ) : (
            <ProjectMilestoneForm
              error={createMilestone.error?.message ?? null}
              isPending={createMilestone.isPending}
              onSubmit={async (input) => {
                await createMilestone.mutateAsync({
                  input,
                  projectId,
                });
              }}
            />
          )}
        </div>
      ) : null}
      <ProjectMilestoneList
        canManage={canManage}
        milestones={milestones}
        onDelete={(milestone) => {
          deleteMilestone
            .mutateAsync({ id: milestone.id, projectId })
            .catch(() => undefined);
        }}
        onEdit={setEditingMilestone}
      />
      {deleteMilestone.error ? (
        <p className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-3 text-rose-700 text-sm">
          {deleteMilestone.error.message}
        </p>
      ) : null}
    </section>
  );
}
