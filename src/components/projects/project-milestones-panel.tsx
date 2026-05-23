import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type FormEvent, useState } from "react";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="flex flex-col gap-1">
      {sortedMilestones.map((milestone) => {
        const isDone = milestone.status === "done";
        const isInProgress = milestone.status === "in_progress";

        let badgeBg = "bg-slate-50 dark:bg-slate-900/50";
        let badgeTextColor = "text-slate-500 dark:text-slate-400";
        let badgeIcon = Calendar01Icon;

        if (isDone) {
          badgeBg = "bg-emerald-50 dark:bg-emerald-950/20";
          badgeTextColor = "text-emerald-600 dark:text-emerald-400";
          badgeIcon = CheckmarkCircle01Icon;
        } else if (isInProgress) {
          badgeBg = "bg-teal-50 dark:bg-teal-950/20";
          badgeTextColor = "text-teal-600 dark:text-teal-400";
          badgeIcon = Clock01Icon;
        }

        return (
          <div
            className="group relative flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
            key={milestone.id}
          >
            {/* Status Icon Badge */}
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105",
                badgeBg,
                badgeTextColor
              )}
            >
              <HugeiconsIcon icon={badgeIcon} size={14} strokeWidth={2} />
            </div>

            {/* Content Block */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "font-medium text-foreground text-xs leading-5 transition-colors group-hover:text-accent-foreground",
                    isDone && "text-muted-foreground/60 line-through"
                  )}
                >
                  {milestone.title}
                </p>
                <span className="sr-only">
                  {formatMilestoneStatus(milestone.status)}
                </span>
              </div>
              {milestone.description ? (
                <p className="mt-0.5 whitespace-pre-wrap text-[11px] text-muted-foreground leading-4">
                  {milestone.description}
                </p>
              ) : null}
            </div>

            {/* Time / Actions */}
            <div className="relative ml-2 flex h-5 min-w-16 shrink-0 items-center justify-end">
              <span className="select-none text-[11px] text-muted-foreground leading-5 transition-opacity duration-200 group-hover:opacity-0">
                {milestone.dueDate
                  ? milestone.dueDate
                  : formatMilestoneStatus(milestone.status)}
              </span>

              {canManage ? (
                <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    className="h-6 border border-border/40 bg-background px-2 font-bold text-[10px] text-foreground transition-transform duration-200 hover:scale-105 hover:bg-muted active:scale-95"
                    onClick={() => onEdit(milestone)}
                    type="button"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                  <Button
                    className="h-6 w-6 border border-border/40 p-0 text-muted-foreground transition-transform duration-200 hover:scale-105 hover:bg-rose-500 hover:text-white active:scale-95"
                    onClick={() => onDelete(milestone)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={10} />
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

  const statusItems = MILESTONE_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
  }));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined);
      }}
    >
      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-12">
          <Field className="sm:col-span-8">
            <FieldLabel htmlFor="milestone-title">Title</FieldLabel>
            <Input
              className="transition-all focus-visible:border-primary focus-visible:ring-primary/20"
              id="milestone-title"
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Design Hand-off"
              required
              value={state.title}
            />
          </Field>
          <Field className="sm:col-span-4">
            <FieldLabel htmlFor="milestone-order">Order</FieldLabel>
            <Input
              className="transition-all focus-visible:border-primary focus-visible:ring-primary/20"
              id="milestone-order"
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
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-12">
          <Field className="sm:col-span-6">
            <FieldLabel>Status</FieldLabel>
            <Select
              items={statusItems}
              onValueChange={(value) =>
                setState((current) => ({
                  ...current,
                  status: value as ProjectMilestoneStatus,
                }))
              }
              value={state.status}
            >
              <SelectTrigger className="w-full transition-all focus-visible:border-primary focus-visible:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MILESTONE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="sm:col-span-6">
            <FieldLabel htmlFor="milestone-due">Due Date</FieldLabel>
            <Input
              className="transition-all focus-visible:border-primary focus-visible:ring-primary/20"
              id="milestone-due"
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
              type="date"
              value={state.dueDate}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="milestone-description">Description</FieldLabel>
          <Textarea
            className="transition-all focus-visible:border-primary focus-visible:ring-primary/20"
            id="milestone-description"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Add deliverables details or milestone description..."
            value={state.description}
          />
        </Field>

        {formError || error ? (
          <FieldError>{formError ?? error}</FieldError>
        ) : null}
      </FieldGroup>

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
  const [isAddOpen, setIsAddOpen] = useState(false);
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
    <section className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-border/40 border-b pb-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg">
            Project Milestones
          </h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Track key deliverables and deadlines for maximum transparency.
          </p>
        </div>
        {canManage && (
          <Button
            className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setIsAddOpen(true)}
            size="sm"
          >
            Add Milestone
          </Button>
        )}
      </div>

      {/* Add Milestone Dialog */}
      {canManage && (
        <Dialog onOpenChange={setIsAddOpen} open={isAddOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
              <DialogDescription>
                Create a new milestone or deliverable for this project to track
                progress.
              </DialogDescription>
            </DialogHeader>
            <ProjectMilestoneForm
              error={createMilestone.error?.message ?? null}
              isPending={createMilestone.isPending}
              onCancel={() => setIsAddOpen(false)}
              onSubmit={async (input) => {
                await createMilestone.mutateAsync({
                  input,
                  projectId,
                });
                setIsAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Milestone Dialog */}
      {canManage && (
        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setEditingMilestone(null);
            }
          }}
          open={Boolean(editingMilestone)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Milestone</DialogTitle>
              <DialogDescription>
                Update the milestone details or status.
              </DialogDescription>
            </DialogHeader>
            {editingMilestone && (
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
            )}
          </DialogContent>
        </Dialog>
      )}

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
