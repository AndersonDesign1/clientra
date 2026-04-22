import {
  keepPreviousData,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import type { DashboardActivityEvent } from "@/shared/dashboard-activity";

export type { DashboardActivityEvent } from "@/shared/dashboard-activity";

export interface SearchResults {
  clients: Client[];
  projects: Project[];
}

export interface ClientPayload {
  company: string;
  email: string;
  name: string;
  notes?: string;
  phone?: string;
  status: Client["status"];
  tags: string[];
  website?: string;
}

export interface ProjectPayload {
  budget: number;
  clientId: string;
  deadline?: string;
  description?: string;
  status: Project["status"];
  title: string;
}

export interface ManagedUser {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  image: string | null;
  name: string;
  providers: string[];
  role: "admin" | "client";
}

export interface ProjectFile {
  createdAt: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  id: string;
  mimeType: string;
  projectId: string;
  uploadedBy: string;
  uploaderName: string;
}

export interface ProjectComment {
  authorId: string;
  authorName: string;
  authorRole: "admin" | "client";
  content: string;
  createdAt: string;
  id: string;
  projectId: string;
}

export type ProjectActivityEvent =
  | {
      createdAt: string;
      id: string;
      type: "project_created";
    }
  | {
      authorId: string;
      authorName: string;
      authorRole: "admin" | "client";
      contentPreview: string;
      createdAt: string;
      id: string;
      type: "note_added";
    }
  | {
      authorId: string;
      authorName: string;
      createdAt: string;
      fileId: string;
      fileName: string;
      id: string;
      type: "file_uploaded";
    };

export interface ProjectCollaborationPayload {
  activity: ProjectActivityEvent[];
  comments: ProjectComment[];
}

export interface LoadableData<TData> {
  data: TData | undefined;
  error: string | null;
  isLoading: boolean;
}

const EMPTY_SEARCH_RESULTS: SearchResults = {
  clients: [],
  projects: [],
};

const getServerRequestContext = createIsomorphicFn()
  .client(() => null)
  .server(async () => {
    const { getRequest, getRequestHeader } = await import(
      "@tanstack/react-start/server"
    );

    return {
      cookieHeader: getRequestHeader("cookie"),
      requestUrl: getRequest().url,
    };
  });

async function createApiRequest(path: string, init?: RequestInit) {
  const serverRequestContext = await getServerRequestContext();

  if (!serverRequestContext) {
    return fetch(path, init);
  }

  const headers = new Headers(init?.headers);

  if (serverRequestContext.cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", serverRequestContext.cookieHeader);
  }

  return fetch(new URL(path, serverRequestContext.requestUrl), {
    ...init,
    headers,
  });
}

export const queryKeys = {
  clients: ["clients"] as const,
  dashboardActivity: ["dashboard-activity"] as const,
  projectCollaboration: (projectId: string) =>
    ["project-collaboration", projectId] as const,
  projectFiles: (projectId: string) => ["project-files", projectId] as const,
  projects: ["projects"] as const,
  search: (query: string) => ["search", query] as const,
  users: ["users"] as const,
};

function mapQueryState<TData>(query: {
  data: TData | undefined;
  error: Error | null;
  isPending: boolean;
}): LoadableData<TData> {
  return {
    data: query.data,
    error: query.error?.message ?? null,
    isLoading: query.isPending,
  };
}

function isManagedUser(value: unknown): value is ManagedUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === "admin" || candidate.role === "client") &&
    typeof candidate.emailVerified === "boolean" &&
    (typeof candidate.image === "string" || candidate.image === null) &&
    typeof candidate.createdAt === "string" &&
    Array.isArray(candidate.providers) &&
    candidate.providers.every((provider) => typeof provider === "string")
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await createApiRequest(path);
  let data: { error?: string } | T | null;

  try {
    data = (await response.json()) as { error?: string } | T;
  } catch (error) {
    if (response.ok) {
      const parseMessage =
        error instanceof Error ? error.message : "Unknown JSON parse failure";
      throw new Error(
        `Request succeeded with status ${response.status} but returned invalid JSON: ${parseMessage}`
      );
    }

    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

async function updateUserRoleRequest(
  id: string,
  role: ManagedUser["role"]
): Promise<ManagedUser> {
  const response = await createApiRequest(`/api/users/${id}`, {
    body: JSON.stringify({ role }),
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  const data = (await response.json().catch(() => null)) as
    | ManagedUser
    | { error?: string }
    | null;

  const errorMessage =
    data && "error" in data && typeof data.error === "string"
      ? data.error
      : null;

  if (!response.ok) {
    throw new Error(
      errorMessage ?? `Request failed with status ${response.status}`
    );
  }

  if (!isManagedUser(data)) {
    throw new Error(
      errorMessage ?? "The server returned an invalid user payload."
    );
  }

  return data;
}

async function createClientRequest(input: ClientPayload): Promise<Client> {
  const response = await createApiRequest("/api/clients", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return parseMutationResponse<Client>(response, "client");
}

async function updateClientRequest({
  id,
  input,
}: {
  id: string;
  input: ClientPayload;
}): Promise<Client> {
  const response = await createApiRequest(`/api/clients/${id}`, {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  return parseMutationResponse<Client>(response, "client");
}

async function deleteClientRequest(id: string) {
  const response = await createApiRequest(`/api/clients/${id}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.error ?? `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function createProjectRequest(input: ProjectPayload): Promise<Project> {
  const response = await createApiRequest("/api/projects", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return parseMutationResponse<Project>(response, "project");
}

async function updateProjectRequest({
  id,
  input,
}: {
  id: string;
  input: ProjectPayload;
}): Promise<Project> {
  const response = await createApiRequest(`/api/projects/${id}`, {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  return parseMutationResponse<Project>(response, "project");
}

async function deleteProjectRequest(id: string) {
  const response = await createApiRequest(`/api/projects/${id}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.error ?? `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function parseMutationResponse<TRecord extends { id: unknown }>(
  response: Response,
  recordName: string
): Promise<TRecord> {
  const data = (await response.json().catch(() => null)) as
    | TRecord
    | { error?: string }
    | null;

  if (!response.ok) {
    const errorMessage =
      data && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!data || typeof data !== "object" || !("id" in data)) {
    throw new Error(`The server returned an invalid ${recordName} payload.`);
  }

  return data as TRecord;
}

async function deleteUserRequest(id: string) {
  const response = await createApiRequest(`/api/users/${id}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.error ?? `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function deleteProjectFileRequest(id: string) {
  const response = await createApiRequest(`/api/files/${id}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.error ?? `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function createProjectCommentRequest({
  content,
  projectId,
}: {
  content: string;
  projectId: string;
}): Promise<ProjectComment> {
  const response = await createApiRequest("/api/notes", {
    body: JSON.stringify({
      content,
      projectId,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as
    | ProjectComment
    | { error?: string }
    | null;

  if (!response.ok) {
    const errorMessage =
      data && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const candidate = data as { id?: unknown } | null;

  if (
    !candidate ||
    typeof candidate !== "object" ||
    typeof candidate.id !== "string"
  ) {
    throw new Error("The server returned an invalid collaboration payload.");
  }

  return candidate as ProjectComment;
}

export function clientsQueryOptions() {
  return queryOptions({
    queryFn: () => fetchJson<Client[]>("/api/clients"),
    queryKey: queryKeys.clients,
  });
}

export function projectsQueryOptions() {
  return queryOptions({
    queryFn: () => fetchJson<Project[]>("/api/projects"),
    queryKey: queryKeys.projects,
  });
}

export function usersQueryOptions() {
  return queryOptions({
    queryFn: () => fetchJson<ManagedUser[]>("/api/users"),
    queryKey: queryKeys.users,
  });
}

export function dashboardActivityQueryOptions() {
  return queryOptions({
    queryFn: () =>
      fetchJson<DashboardActivityEvent[]>("/api/dashboard/activity"),
    queryKey: queryKeys.dashboardActivity,
  });
}

export function projectFilesQueryOptions(projectId: string) {
  return queryOptions({
    queryFn: () => fetchJson<ProjectFile[]>(`/api/projects/${projectId}/files`),
    queryKey: queryKeys.projectFiles(projectId),
  });
}

export function projectCollaborationQueryOptions(projectId: string) {
  return queryOptions({
    queryFn: () =>
      fetchJson<ProjectCollaborationPayload>(
        `/api/projects/${projectId}/collaboration`
      ),
    queryKey: queryKeys.projectCollaboration(projectId),
  });
}

export function searchQueryOptions(query: string) {
  const normalized = query.trim();

  return queryOptions({
    queryFn: () =>
      fetchJson<SearchResults>(
        `/api/search?${new URLSearchParams({
          query: normalized,
        }).toString()}`
      ),
    queryKey: queryKeys.search(normalized),
  });
}

export function ensureClientsData(queryClient: QueryClient) {
  return queryClient.ensureQueryData(clientsQueryOptions());
}

export function ensureProjectsData(queryClient: QueryClient) {
  return queryClient.ensureQueryData(projectsQueryOptions());
}

export function ensureUsersData(queryClient: QueryClient) {
  return queryClient.ensureQueryData(usersQueryOptions());
}

export function ensureDashboardActivityData(queryClient: QueryClient) {
  return queryClient.ensureQueryData(dashboardActivityQueryOptions());
}

export function ensureProjectFilesData(
  queryClient: QueryClient,
  projectId: string
) {
  return queryClient.ensureQueryData(projectFilesQueryOptions(projectId));
}

export function ensureProjectCollaborationData(
  queryClient: QueryClient,
  projectId: string
) {
  return queryClient.ensureQueryData(
    projectCollaborationQueryOptions(projectId)
  );
}

export function useClientsData(): LoadableData<Client[]> {
  return mapQueryState(useQuery(clientsQueryOptions()));
}

export function useProjectsData(): LoadableData<Project[]> {
  return mapQueryState(useQuery(projectsQueryOptions()));
}

export function useUsersData(): LoadableData<ManagedUser[]> {
  return mapQueryState(useQuery(usersQueryOptions()));
}

export function useDashboardActivityData(): LoadableData<
  DashboardActivityEvent[]
> {
  return mapQueryState(useQuery(dashboardActivityQueryOptions()));
}

export function useProjectFilesData(
  projectId: string
): LoadableData<ProjectFile[]> {
  return mapQueryState(useQuery(projectFilesQueryOptions(projectId)));
}

export function useProjectCollaborationData(
  projectId: string
): LoadableData<ProjectCollaborationPayload> {
  return mapQueryState(useQuery(projectCollaborationQueryOptions(projectId)));
}

export function useSearchData(query: string): LoadableData<SearchResults> {
  const normalized = query.trim();
  const result = useQuery({
    ...searchQueryOptions(normalized),
    enabled: normalized.length > 0,
    placeholderData: keepPreviousData,
  });

  if (!normalized) {
    return {
      data: EMPTY_SEARCH_RESULTS,
      error: null,
      isLoading: false,
    };
  }

  return mapQueryState(result);
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: ManagedUser["role"] }) =>
      updateUserRoleRequest(id, role),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<ManagedUser[]>(queryKeys.users, (current) =>
        (current ?? []).map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
    },
  });
}

function invalidateAdminData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.clients });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity });
  queryClient.invalidateQueries({ queryKey: ["search"] });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientRequest,
    onSuccess: (createdClient) => {
      queryClient.setQueryData<Client[]>(queryKeys.clients, (current) => [
        createdClient,
        ...(current ?? []),
      ]);
      invalidateAdminData(queryClient);
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientRequest,
    onSuccess: (updatedClient) => {
      queryClient.setQueryData<Client[]>(queryKeys.clients, (current) =>
        (current ?? []).map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        )
      );
      invalidateAdminData(queryClient);
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteClientRequest(id),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Client[]>(queryKeys.clients, (current) =>
        (current ?? []).filter((client) => client.id !== variables.id)
      );
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current) =>
        (current ?? []).filter((project) => project.clientId !== variables.id)
      );
      invalidateAdminData(queryClient);
    },
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectRequest,
    onSuccess: (createdProject) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current) => [
        createdProject,
        ...(current ?? []),
      ]);
      invalidateAdminData(queryClient);
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProjectRequest,
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current) =>
        (current ?? []).map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectCollaboration(updatedProject.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectFiles(updatedProject.id),
      });
      invalidateAdminData(queryClient);
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteProjectRequest(id),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects, (current) =>
        (current ?? []).filter((project) => project.id !== variables.id)
      );
      queryClient.removeQueries({
        queryKey: queryKeys.projectCollaboration(variables.id),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.projectFiles(variables.id),
      });
      invalidateAdminData(queryClient);
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteUserRequest(id),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ManagedUser[]>(queryKeys.users, (current) =>
        (current ?? []).filter((user) => user.id !== variables.id)
      );
    },
  });
}

export function useDeleteProjectFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId }: { fileId: string; projectId: string }) =>
      deleteProjectFileRequest(fileId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<ProjectFile[]>(
        queryKeys.projectFiles(variables.projectId),
        (current) =>
          (current ?? []).filter((file) => file.id !== variables.fileId)
      );
    },
  });
}

function truncateCommentPreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}

function createCommentActivityEvent(
  comment: ProjectComment
): ProjectActivityEvent {
  return {
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    contentPreview: truncateCommentPreview(comment.content),
    createdAt: comment.createdAt,
    id: `note:${comment.id}`,
    type: "note_added",
  };
}

export function useCreateProjectCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      content,
      projectId,
    }: {
      content: string;
      projectId: string;
    }) => createProjectCommentRequest({ content, projectId }),
    onSuccess: (comment) => {
      queryClient.setQueryData<ProjectCollaborationPayload>(
        queryKeys.projectCollaboration(comment.projectId),
        (current) => {
          const nextComments = [comment, ...(current?.comments ?? [])];
          const nextActivity = [
            createCommentActivityEvent(comment),
            ...(current?.activity ?? []),
          ].sort(
            (left, right) =>
              Date.parse(right.createdAt) - Date.parse(left.createdAt)
          );

          return {
            activity: nextActivity,
            comments: nextComments,
          };
        }
      );
    },
  });
}
