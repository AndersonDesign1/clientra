import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  adminOwnsProject: vi.fn(),
  adminOwnsProjectMilestone: vi.fn(),
  canAccessProject: vi.fn(),
  createProjectMilestoneRecord: vi.fn(),
  deleteProjectMilestoneRecord: vi.fn(),
  listProjectMilestonesForUser: vi.fn(),
  serializeProjectMilestone: vi.fn((milestone) => ({
    ...milestone,
    createdAt:
      milestone.createdAt instanceof Date
        ? milestone.createdAt.toISOString()
        : milestone.createdAt,
    updatedAt:
      milestone.updatedAt instanceof Date
        ? milestone.updatedAt.toISOString()
        : milestone.updatedAt,
  })),
  updateProjectMilestoneRecord: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  adminOwnsProject,
  adminOwnsProjectMilestone,
  createProjectMilestoneRecord,
  deleteProjectMilestoneRecord,
  listProjectMilestonesForUser,
  updateProjectMilestoneRecord,
} from "@/db/records";
import { Route as ProjectMilestoneRoute } from "@/routes/api/project-milestones/$id";
import { Route as ProjectMilestonesRoute } from "@/routes/api/projects/$id/milestones";

const milestonesHandlers = ProjectMilestonesRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
  POST: (context: unknown) => Promise<Response>;
};

const milestoneHandlers = ProjectMilestoneRoute.options.server?.handlers as {
  DELETE: (context: unknown) => Promise<Response>;
  PATCH: (context: unknown) => Promise<Response>;
};

const adminUser = {
  activeOrganizationId: "org_1",
  email: "admin@example.com",
  id: "admin_1",
  name: "Admin User",
  role: ROLES.ADMIN,
};

const clientUser = {
  email: "client@example.com",
  id: "client_1",
  name: "Client User",
  role: ROLES.CLIENT,
};

const validPayload = {
  description: "Approve the final design direction.",
  dueDate: "2026-04-12",
  sortOrder: 1,
  status: "in_progress" as const,
  title: "Design approval",
};

function createRequest(path: string, init?: RequestInit) {
  return new Request(`https://clientra.test${path}`, {
    headers: {
      "content-type": "application/json",
      origin: "https://clientra.test",
      "sec-fetch-site": "same-origin",
      ...init?.headers,
    },
    ...init,
  });
}

describe("project milestone API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminOwnsProject).mockResolvedValue(true);
    vi.mocked(adminOwnsProjectMilestone).mockResolvedValue(true);
  });

  it("lets authorized users read milestones", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(clientUser);
    vi.mocked(listProjectMilestonesForUser).mockResolvedValue([
      {
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        description: validPayload.description,
        dueDate: validPayload.dueDate,
        id: "milestone_1",
        projectId: "project_1",
        sortOrder: 1,
        status: "in_progress",
        title: validPayload.title,
        updatedAt: new Date("2026-04-01T10:00:00.000Z"),
      },
    ]);

    const response = await milestonesHandlers.GET({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/milestones"),
    } as never);

    expect(listProjectMilestonesForUser).toHaveBeenCalledWith(
      "project_1",
      clientUser
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      { id: "milestone_1", title: "Design approval" },
    ]);
  });

  it("blocks clients from creating milestones", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(clientUser);

    const response = await milestonesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/milestones", {
        body: JSON.stringify(validPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(createProjectMilestoneRecord).not.toHaveBeenCalled();
  });

  it("lets admins create milestones", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(createProjectMilestoneRecord).mockResolvedValue({
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      description: validPayload.description,
      dueDate: validPayload.dueDate,
      id: "milestone_1",
      projectId: "project_1",
      sortOrder: 1,
      status: "in_progress",
      title: validPayload.title,
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    });

    const response = await milestonesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/milestones", {
        body: JSON.stringify(validPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(201);
    expect(createProjectMilestoneRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project_1",
        title: "Design approval",
      })
    );
  });

  it("validates bad payloads and returns 404 for missing milestones", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);

    const invalidResponse = await milestoneHandlers.PATCH({
      params: { id: "milestone_1" },
      request: createRequest("/api/project-milestones/milestone_1", {
        body: JSON.stringify({ ...validPayload, sortOrder: -1 }),
        method: "PATCH",
      }),
    } as never);

    expect(invalidResponse.status).toBe(422);
    expect(updateProjectMilestoneRecord).not.toHaveBeenCalled();

    const invalidDueDateResponse = await milestonesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/milestones", {
        body: JSON.stringify({ ...validPayload, dueDate: "next sprint" }),
        method: "POST",
      }),
    } as never);

    expect(invalidDueDateResponse.status).toBe(422);
    expect(createProjectMilestoneRecord).not.toHaveBeenCalled();

    vi.mocked(deleteProjectMilestoneRecord).mockResolvedValue(false);

    const missingResponse = await milestoneHandlers.DELETE({
      params: { id: "missing" },
      request: createRequest("/api/project-milestones/missing", {
        method: "DELETE",
      }),
    } as never);

    expect(missingResponse.status).toBe(404);
  });
});
