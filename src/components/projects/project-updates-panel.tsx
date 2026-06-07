import { type FormEvent, useState } from "react";
import { UnifiedActivityList } from "@/components/common/activity-list";
import { PanelSection } from "@/components/common/panel-section";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  MutationErrorBanner,
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

  const statusItems = UPDATE_STATUS_OPTIONS.map((option) => ({
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
        <div className="grid gap-4 sm:grid-cols-12">
          <Field className="sm:col-span-8">
            <FieldLabel htmlFor="update-title">Title</FieldLabel>
            <Input
              className="transition-all focus-visible:border-primary focus-visible:ring-primary/20"
              id="update-title"
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Completed Sprint 2 Review & Milestones"
              required
              value={state.title}
            />
          </Field>
          <Field className="sm:col-span-4">
            <FieldLabel>Project Status Accent</FieldLabel>
            <Select
              items={statusItems}
              onValueChange={(value) =>
                setState((current) => ({
                  ...current,
                  status: value as ProjectUpdateStatus,
                }))
              }
              value={state.status}
            >
              <SelectTrigger className="w-full transition-all focus-visible:border-primary focus-visible:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {UPDATE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="update-description">
            Update Description
          </FieldLabel>
          <Textarea
            className="min-h-[110px] transition-all focus-visible:border-primary focus-visible:ring-primary/20"
            id="update-description"
            onChange={(event) =>
              setState((current) => ({
                ...current,
                body: event.target.value,
              }))
            }
            placeholder="Describe completed works, ongoing focus, or blockages..."
            required
            value={state.body}
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

function useCrudDialogs<T>() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  return {
    isAddOpen,
    setIsAddOpen,
    editingItem,
    setEditingItem,
  };
}

export function ProjectUpdatesPanel({
  canManage,
  projectId,
}: ProjectUpdatesPanelProps) {
  const updatesQuery = useProjectUpdatesData(projectId);
  const createUpdate = useCreateProjectUpdateMutation();
  const updateUpdate = useUpdateProjectUpdateMutation();
  const deleteUpdate = useDeleteProjectUpdateMutation();

  const {
    isAddOpen,
    setIsAddOpen,
    editingItem: editingUpdate,
    setEditingItem: setEditingUpdate,
  } = useCrudDialogs<ProjectUpdate>();

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
    <PanelSection
      action={
        canManage && (
          <Button
            className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setIsAddOpen(true)}
            size="sm"
          >
            Publish Update
          </Button>
        )
      }
      description="Concise status reports outlining recent progress and forward plans."
      title="Project Updates"
    >
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
      <MutationErrorBanner error={deleteUpdate.error} />
    </PanelSection>
  );
}
