import type { Client } from "@/features/clients/mock-data";
import type { Project } from "@/features/projects/mock-data";
import type { DashboardActivityEvent } from "@/shared/dashboard-activity";

export const STATUS_ORDER: Project["status"][] = [
  "planning",
  "in_progress",
  "completed",
];

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function parseDateOnlyLocal(value: string) {
  const [datePart] = value.split("T");
  const parts = datePart?.split("-").map(Number);

  if (parts?.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatStatusText(value: string) {
  return value.replaceAll("_", " ");
}

export function getProjectStatusData(projects: Project[]) {
  return STATUS_ORDER.map((status) => ({
    status: formatStatusText(status),
    total: projects.filter((project) => project.status === status).length,
  }));
}

export function getBudgetByStatusData(projects: Project[]) {
  return STATUS_ORDER.map((status) => ({
    budget: projects
      .filter((project) => project.status === status)
      .reduce((total, project) => total + project.budget, 0),
    status: formatStatusText(status),
  }));
}

export function getBudgetByClientData(projects: Project[], clients: Client[]) {
  return clients
    .map((client) => ({
      budget: projects
        .filter((project) => project.clientId === client.id)
        .reduce((total, project) => total + project.budget, 0),
      client: client.company,
    }))
    .filter((item) => item.budget > 0)
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 6);
}

export function getDeadlineData(projects: Project[]) {
  const buckets = new Map<
    string,
    { label: string; count: number; sort: number }
  >();

  for (const project of projects) {
    const date = parseDateOnlyLocal(project.deadline);
    if (!date) {
      continue;
    }

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = buckets.get(key) ?? {
      count: 0,
      label: formatMonthLabel(date),
      sort: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
    };

    current.count += 1;
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .sort((a, b) => a.sort - b.sort)
    .map(({ count, label }) => ({ count, label }));
}

export function getActivityTypeData(activity: DashboardActivityEvent[]) {
  const labels: Record<DashboardActivityEvent["type"], string> = {
    client_created: "Clients",
    comment_added: "Comments",
    file_uploaded: "Files",
    project_created: "Projects",
  };

  return Object.entries(labels).map(([type, label]) => ({
    label,
    total: activity.filter((event) => event.type === type).length,
  }));
}

export function getNextDeadline(projects: Project[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return projects
    .map((project) => {
      const deadlineDate = parseDateOnlyLocal(project.deadline);

      return {
        ...project,
        deadlineTime: deadlineDate?.getTime() ?? Number.NaN,
      };
    })
    .filter(
      (project) =>
        Number.isFinite(project.deadlineTime) &&
        project.deadlineTime >= today.getTime()
    )
    .sort((a, b) => a.deadlineTime - b.deadlineTime)[0];
}

export function getDeadlineLabel(value: string) {
  const date = parseDateOnlyLocal(value);
  if (!date) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
