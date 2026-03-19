import { useEffect, useEffectEvent, useState } from "react";
import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";

export interface SearchResults {
  clients: Client[];
  projects: Project[];
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
