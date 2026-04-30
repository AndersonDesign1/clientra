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

function getStatusVariant(status: ProjectUpdateStatus) {
  if (status === "blocked" || status === "at_risk") {
    return "destructive" as const;
  }

  if (status === "complete") {
    return "secondary" as const;
  }

  return "outline" as const;
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

  return (
    <div className="grid gap-3">
      {updates.map((update) => (
        <article
          className="rounded-xl border border-slate-200 p-4"
          key={update.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(update.status)}>
                  {formatProjectUpdateStatus(update.status)}
                </Badge>
                <span className="text-slate-500 text-xs">
                  {new Date(update.createdAt).toLocaleString()}
                </span>
              </div>
              <h3 className="font-medium text-slate-900">{update.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-slate-700 text-sm leading-6">
                {update.body}
              </p>
              <p className="mt-3 text-slate-500 text-xs">
                Published by {update.authorName}
              </p>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onEdit(update)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(update)}
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
  let submitLabel = "Publish update";

  if (initialUpdate) {
    submitLabel = "Save update";
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
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={(event) => {
        handleSubmit(event).catch(() => undefined);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
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
      <label className="mt-3 grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Update</span>
        <textarea
          className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
          onChange={(event) =>
            setState((current) => ({
              ...current,
              body: event.target.value,
            }))
          }
          value={state.body}
        />
      </label>
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
      <section className="rounded-xl border bg-white p-4">
        <LoadingPanel
          description="Loading project updates."
          title="Loading updates"
        />
      </section>
    );
  }

  if (updatesQuery.error && !updatesQuery.data) {
    return <ErrorPanel description={updatesQuery.error} />;
  }

  const updates = updatesQuery.data ?? [];

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="mb-4">
        <h2 className="font-medium text-lg text-slate-900">Project updates</h2>
        <p className="mt-1 text-slate-600 text-sm">
          Short status reports keep progress visible without digging through
          comments.
        </p>
      </div>
      {canManage ? (
        <div className="mb-4">
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
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {deleteUpdate.error.message}
        </p>
      ) : null}
    </section>
  );
}
