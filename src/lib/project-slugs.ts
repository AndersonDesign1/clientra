import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import { findClientByPathParam, getClientPathParam } from "@/lib/client-slugs";

export function getProjectSlug(title: string) {
  return slugifyProjectTitle(title);
}

export function getProjectPathParam(project: Project) {
  return project.slug || getProjectSlug(project.title) || project.id;
}

export function getProjectPathParams(project: Project, clients: Client[]) {
  const client = clients.find((entry) => entry.id === project.clientId);

  return {
    clientSlug: client ? getClientPathParam(client) : project.clientId,
    projectSlug: getProjectPathParam(project),
  };
}

export function findProjectByPathParam(projects: Project[], pathParam: string) {
  return projects.find(
    (project) =>
      project.id === pathParam || getProjectPathParam(project) === pathParam
  );
}

export function findProjectByClientAndProjectPathParams({
  clients,
  clientSlug,
  projects,
  projectSlug,
}: {
  clients: Client[];
  clientSlug: string;
  projects: Project[];
  projectSlug: string;
}) {
  return projects.find((project) => {
    const client = clients.find((entry) => entry.id === project.clientId);
    const pathClient = findClientByPathParam(clients, clientSlug);
    const matchesClient =
      project.clientId === clientSlug ||
      pathClient?.id === project.clientId ||
      (client ? getClientPathParam(client) === clientSlug : false);
    const matchesProject =
      project.id === projectSlug ||
      getProjectPathParam(project) === projectSlug;

    return matchesClient && matchesProject;
  });
}

function slugifyProjectTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
