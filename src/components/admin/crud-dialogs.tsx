import {
  cloneElement,
  type FormEvent,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatStatusLabel } from "@/components/common/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FieldDescription,
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
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import type { ClientPayload, ProjectPayload } from "@/lib/api";
import {
  useCreateClientMutation,
  useCreateProjectMutation,
  useDeleteClientMutation,
  useDeleteProjectMutation,
  useUpdateClientMutation,
  useUpdateProjectMutation,
} from "@/lib/api";

const CLIENT_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
] as const;

const PROJECT_STATUS_OPTIONS = [
  { label: "Planning", value: "planning" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
] as const;

export function formatClientOptionLabel(client: Client) {
  return `${client.company} - ${client.name}`;
}

function getProjectStatusLabel(status: Project["status"]) {
  return PROJECT_STATUS_OPTIONS.find((option) => option.value === status)
    ?.label;
}

interface ClientFormState {
  company: string;
  email: string;
  name: string;
  notes: string;
  phone: string;
  status: Client["status"];
  tags: string;
  website: string;
}

interface ProjectFormState {
  budget: string;
  clientId: string;
  deadline: string;
  description: string;
  status: Project["status"];
  title: string;
}

function getClientFormState(client?: Client): ClientFormState {
  return {
    company: client?.company ?? "",
    email: client?.email ?? "",
    name: client?.name ?? "",
    notes: client?.notes ?? "",
    phone: client?.phone ?? "",
    status: client?.status ?? "active",
    tags: client?.tags.join(", ") ?? "",
    website: client?.website ?? "",
  };
}

function getProjectFormState(
  clients: Client[],
  project?: Project
): ProjectFormState {
  return {
    budget: project ? String(project.budget) : "0",
    clientId: project?.clientId ?? clients[0]?.id ?? "",
    deadline: project?.deadline ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "planning",
    title: project?.title ?? "",
  };
}

function toClientPayload(state: ClientFormState): ClientPayload {
  return {
    company: state.company.trim(),
    email: state.email.trim(),
    name: state.name.trim(),
    notes: optionalString(state.notes),
    phone: optionalString(state.phone),
    status: state.status,
    tags: state.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    website: optionalString(state.website),
  };
}

function toProjectPayload(state: ProjectFormState): ProjectPayload {
  const budget = Number(state.budget);

  return {
    budget: Number.isFinite(budget) ? budget : 0,
    clientId: state.clientId,
    deadline: optionalString(state.deadline),
    description: optionalString(state.description),
    status: state.status,
    title: state.title.trim(),
  };
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getMutationError(error: Error | null) {
  return error?.message ?? null;
}

function useClientFormState(client: Client | undefined, open: boolean) {
  const initialState = useMemo(() => getClientFormState(client), [client]);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (open) {
      setState(initialState);
    }
  }, [initialState, open]);

  return [state, setState] as const;
}

function useProjectFormState(
  clients: Client[],
  project: Project | undefined,
  open: boolean
) {
  const initialState = useMemo(
    () => getProjectFormState(clients, project),
    [clients, project]
  );
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (open) {
      setState(initialState);
    }
  }, [initialState, open]);

  return [state, setState] as const;
}

export function ClientFormDialog({
  client,
  onOpenChange,
  onSaved,
  open,
  trigger,
}: {
  client?: Client;
  onOpenChange: (open: boolean) => void;
  onSaved?: (client: Client) => void;
  open: boolean;
  trigger: React.ReactNode;
}) {
  const createClient = useCreateClientMutation();
  const updateClient = useUpdateClientMutation();
  const isEditing = Boolean(client);
  const activeMutation = isEditing ? updateClient : createClient;
  const [state, setState] = useClientFormState(client, open);
  const triggerElement = isValidElement<{ onClick?: () => void }>(trigger)
    ? cloneElement(trigger, { onClick: () => onOpenChange(true) })
    : trigger;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = toClientPayload(state);

    const savedClient = client
      ? await updateClient.mutateAsync({ id: client.id, input: payload })
      : await createClient.mutateAsync(payload);

    onOpenChange(false);
    onSaved?.(savedClient);
  }

  return (
    <>
      {triggerElement}
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit client" : "Create client"}
            </DialogTitle>
            <DialogDescription>
              Keep the client profile small, useful, and easy to scan.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="client-name">Contact name</FieldLabel>
                  <Input
                    id="client-name"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    value={state.name}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client-company">Company</FieldLabel>
                  <Input
                    id="client-company"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        company: event.target.value,
                      }))
                    }
                    required
                    value={state.company}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="client-email">Email</FieldLabel>
                  <Input
                    id="client-email"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    type="email"
                    value={state.email}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client-phone">Phone</FieldLabel>
                  <Input
                    id="client-phone"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    value={state.phone}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="client-website">Website</FieldLabel>
                  <Input
                    id="client-website"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        website: event.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                    type="url"
                    value={state.website}
                  />
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      setState((current) => ({
                        ...current,
                        status: value as Client["status"],
                      }))
                    }
                    value={state.status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CLIENT_STATUS_OPTIONS.map((option) => (
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
                <FieldLabel htmlFor="client-tags">Tags</FieldLabel>
                <Input
                  id="client-tags"
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="retainer, web"
                  value={state.tags}
                />
                <FieldDescription>Separate tags with commas.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="client-notes">Notes</FieldLabel>
                <Textarea
                  id="client-notes"
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  value={state.notes}
                />
              </Field>
              <FieldError>{getMutationError(activeMutation.error)}</FieldError>
            </FieldGroup>
            <DialogFooter>
              <Button
                disabled={activeMutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={activeMutation.isPending} type="submit">
                {activeMutation.isPending ? "Saving..." : "Save client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProjectFormDialog({
  clients,
  onOpenChange,
  onSaved,
  open,
  project,
  trigger,
}: {
  clients: Client[];
  onOpenChange: (open: boolean) => void;
  onSaved?: (project: Project) => void;
  open: boolean;
  project?: Project;
  trigger: React.ReactNode;
}) {
  const createProject = useCreateProjectMutation();
  const updateProject = useUpdateProjectMutation();
  const isEditing = Boolean(project);
  const activeMutation = isEditing ? updateProject : createProject;
  const [state, setState] = useProjectFormState(clients, project, open);
  const selectedClient = clients.find((client) => client.id === state.clientId);
  const hasSelectedClient = Boolean(selectedClient);
  const canSubmit = isEditing ? Boolean(state.clientId) : hasSelectedClient;
  const clientItems = clients.map((client) => ({
    label: formatClientOptionLabel(client),
    value: client.id,
  }));
  const statusItems = PROJECT_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
  }));
  const triggerElement = isValidElement<{ onClick?: () => void }>(trigger)
    ? cloneElement(trigger, { onClick: () => onOpenChange(true) })
    : trigger;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const payload = toProjectPayload(state);

    const savedProject = project
      ? await updateProject.mutateAsync({ id: project.id, input: payload })
      : await createProject.mutateAsync(payload);

    onOpenChange(false);
    onSaved?.(savedProject);
  }

  return (
    <>
      {triggerElement}
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit project" : "Create project"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the project details without changing its linked client."
                : "Choose the client and track the essentials for delivery."}
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FieldGroup>
              {isEditing ? (
                <Field>
                  <FieldLabel>Client</FieldLabel>
                  <div className="rounded-md border border-input bg-input/20 px-2 py-2 text-sm md:text-xs/relaxed">
                    {selectedClient
                      ? formatClientOptionLabel(selectedClient)
                      : "Client unavailable"}
                  </div>
                  <FieldDescription>
                    Projects stay linked to their original client in this edit
                    flow.
                  </FieldDescription>
                </Field>
              ) : (
                <Field data-disabled={clients.length === 0}>
                  <FieldLabel>Client</FieldLabel>
                  <Select
                    disabled={clients.length === 0}
                    items={clientItems}
                    onValueChange={(value) =>
                      setState((current) => ({
                        ...current,
                        clientId: value ?? "",
                      }))
                    }
                    required
                    value={state.clientId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {clientItems.map((client) => (
                          <SelectItem key={client.value} value={client.value}>
                            {client.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {clients.length > 0 ? null : (
                    <FieldDescription>
                      Create a client before creating a project.
                    </FieldDescription>
                  )}
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="project-title">Project name</FieldLabel>
                <Input
                  id="project-title"
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  value={state.title}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    items={statusItems}
                    onValueChange={(value) =>
                      setState((current) => ({
                        ...current,
                        status: value as Project["status"],
                      }))
                    }
                    value={state.status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {getProjectStatusLabel(state.status) ??
                          formatStatusLabel(state.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PROJECT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="project-budget">Budget</FieldLabel>
                  <Input
                    id="project-budget"
                    min="0"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        budget: event.target.value,
                      }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={state.budget}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="project-deadline">Deadline</FieldLabel>
                  <Input
                    id="project-deadline"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        deadline: event.target.value,
                      }))
                    }
                    type="date"
                    value={state.deadline}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="project-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="project-description"
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={state.description}
                />
              </Field>
              <FieldError>{getMutationError(activeMutation.error)}</FieldError>
            </FieldGroup>
            <DialogFooter>
              <Button
                disabled={activeMutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={activeMutation.isPending || !canSubmit}
                type="submit"
              >
                {activeMutation.isPending ? "Saving..." : "Save project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteClientDialog({
  client,
  onDeleted,
  trigger,
}: {
  client: Client;
  onDeleted?: () => void;
  trigger: React.ReactNode;
}) {
  const deleteClient = useDeleteClientMutation();

  async function handleDelete() {
    await deleteClient.mutateAsync({ id: client.id });
    onDeleted?.();
  }

  return (
    <DeleteRecordDialog
      confirmLabel="Delete client"
      description={`Delete ${client.company} and all linked projects, notes, files, invites, and portal access. This cannot be undone.`}
      error={getMutationError(deleteClient.error)}
      isPending={deleteClient.isPending}
      onConfirm={handleDelete}
      title="Delete this client?"
      trigger={trigger}
    />
  );
}

export function DeleteProjectDialog({
  onDeleted,
  project,
  trigger,
}: {
  onDeleted?: () => void;
  project: Project;
  trigger: React.ReactNode;
}) {
  const deleteProject = useDeleteProjectMutation();

  async function handleDelete() {
    await deleteProject.mutateAsync({ id: project.id });
    onDeleted?.();
  }

  return (
    <DeleteRecordDialog
      confirmLabel="Delete project"
      description={`Delete ${project.title}, including its notes, activity, and files. This cannot be undone.`}
      error={getMutationError(deleteProject.error)}
      isPending={deleteProject.isPending}
      onConfirm={handleDelete}
      title="Delete this project?"
      trigger={trigger}
    />
  );
}

function DeleteRecordDialog({
  confirmLabel,
  description,
  error,
  isPending,
  onConfirm,
  title,
  trigger,
}: {
  confirmLabel: string;
  description: string;
  error: string | null;
  isPending: boolean;
  onConfirm: () => Promise<void>;
  title: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerElement = isValidElement<{ onClick?: () => void }>(trigger)
    ? cloneElement(trigger, { onClick: () => setOpen(true) })
    : trigger;

  async function handleConfirm() {
    await onConfirm();
    setOpen(false);
  }

  return (
    <>
      {triggerElement}
      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <FieldError>{error}</FieldError> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm().catch(() => undefined);
              }}
              variant="destructive"
            >
              {isPending ? "Deleting..." : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
