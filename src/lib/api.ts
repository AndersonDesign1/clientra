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

export interface SearchResults {
  clients: Client[];
  projects: Project[];
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

interface LoadableData<TData> {
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
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

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

export function projectFilesQueryOptions(projectId: string) {
  return queryOptions({
    queryFn: () => fetchJson<ProjectFile[]>(`/api/projects/${projectId}/files`),
    queryKey: queryKeys.projectFiles(projectId),
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

export function ensureProjectFilesData(
  queryClient: QueryClient,
  projectId: string
) {
  return queryClient.ensureQueryData(projectFilesQueryOptions(projectId));
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

export function useProjectFilesData(
  projectId: string
): LoadableData<ProjectFile[]> {
  return mapQueryState(useQuery(projectFilesQueryOptions(projectId)));
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
