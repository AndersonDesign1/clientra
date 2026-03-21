import { useEffect, useEffectEvent, useState } from "react";
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
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getClients() {
  return fetchJson<Client[]>("/api/clients");
}

export function getProjects() {
  return fetchJson<Project[]>("/api/projects");
}

export function searchRecords(query: string) {
  const params = new URLSearchParams({ query });
  return fetchJson<SearchResults>(`/api/search?${params.toString()}`);
}

export function getUsers() {
  return fetchJson<ManagedUser[]>("/api/users");
}

export function getProjectFiles(projectId: string) {
  return fetchJson<ProjectFile[]>(`/api/projects/${projectId}/files`);
}

export async function updateUserRole(id: string, role: ManagedUser["role"]) {
  const response = await fetch(`/api/users/${id}`, {
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

export async function deleteUser(id: string) {
  const response = await fetch(`/api/users/${id}`, {
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

export async function deleteProjectFile(id: string) {
  const response = await fetch(`/api/files/${id}`, {
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

function useLoadState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return {
    data,
    error,
    isLoading,
    setData,
    setError,
    setIsLoading,
  };
}

export function useClientsData() {
  const state = useLoadState<Client[]>();
  const runLoad = useEffectEvent(getClients);
  const { setData, setError, setIsLoading } = state;

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    runLoad()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setData, setError, setIsLoading]);

  return state;
}

export function useProjectsData() {
  const state = useLoadState<Project[]>();
  const runLoad = useEffectEvent(getProjects);
  const { setData, setError, setIsLoading } = state;

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    runLoad()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setData, setError, setIsLoading]);

  return state;
}

export function useUsersData() {
  const state = useLoadState<ManagedUser[]>();
  const runLoad = useEffectEvent(getUsers);
  const { setData, setError, setIsLoading } = state;

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    runLoad()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setData, setError, setIsLoading]);

  return state;
}

export function useProjectFilesData(projectId: string) {
  const state = useLoadState<ProjectFile[]>();
  const runLoad = useEffectEvent(getProjectFiles);
  const { setData, setError, setIsLoading } = state;

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    runLoad(projectId)
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [projectId, setData, setError, setIsLoading]);

  return state;
}

export function useSearchData(query: string) {
  const state = useLoadState<SearchResults>();
  const runLoad = useEffectEvent(searchRecords);
  const { setData, setError, setIsLoading } = state;

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    if (!query) {
      setData({ clients: [], projects: [] });
      setIsLoading(false);
      return () => {
        isCancelled = true;
      };
    }

    runLoad(query)
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [query, setData, setError, setIsLoading]);

  return state;
}
