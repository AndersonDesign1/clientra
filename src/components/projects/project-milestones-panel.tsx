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

function getStatusVariant(status: ProjectMilestoneStatus) {
  if (status === "done") {
    return "secondary" as const;
  }

  if (status === "in_progress") {
    return "outline" as const;
  }

  return "default" as const;
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

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {milestones.map((milestone) => (
        <article
          className="rounded-xl border border-slate-200 p-4"
          key={milestone.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant={getStatusVariant(milestone.status)}>
                {formatMilestoneStatus(milestone.status)}
              </Badge>
              <h3 className="mt-3 font-medium text-slate-900">
                {milestone.title}
              </h3>
              {milestone.description ? (
                <p className="mt-2 text-slate-600 text-sm leading-6">
                  {milestone.description}
                </p>
              ) : null}
              <p className="mt-3 text-slate-500 text-xs">
                Due: {milestone.dueDate || "No date set"}
              </p>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onEdit(milestone)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(milestone)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </article>
      ))}
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
  let submitLabel = "Add milestone";

  if (initialMilestone) {
    submitLabel = "Save milestone";
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
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_130px]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            value={state.title}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
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
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Order</span>
          <input
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
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
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            value={state.description}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Due date</span>
          <input
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
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
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {formError ?? error}
        </p>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
        ) : null}
        <Button disabled={isPending} type="submit">
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
      <section className="rounded-xl border bg-white p-4">
        <LoadingPanel
          description="Loading project milestones."
          title="Loading milestones"
        />
      </section>
    );
  }

  if (milestonesQuery.error && !milestonesQuery.data) {
    return <ErrorPanel description={milestonesQuery.error} />;
  }

  const milestones = milestonesQuery.data ?? [];

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="mb-4">
        <h2 className="font-medium text-lg text-slate-900">Milestones</h2>
        <p className="mt-1 text-slate-600 text-sm">
          Track the few deliverables that matter most for client visibility.
        </p>
      </div>
      {canManage ? (
        <div className="mb-4">
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
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {deleteMilestone.error.message}
        </p>
      ) : null}
    </section>
  );
}
