import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  canAccessProject: vi.fn(),
  createProjectUpdateRecord: vi.fn(),
  deleteProjectUpdateRecord: vi.fn(),
  getProjectById: vi.fn(),
  getProjectNotificationContext: vi.fn(),
  listProjectUpdatesForUser: vi.fn(),
  serializeProjectUpdate: vi.fn((update) => ({
    ...update,
    createdAt:
      update.createdAt instanceof Date
        ? update.createdAt.toISOString()
        : update.createdAt,
    updatedAt:
      update.updatedAt instanceof Date
        ? update.updatedAt.toISOString()
        : update.updatedAt,
  })),
  updateProjectUpdateRecord: vi.fn(),
}));

vi.mock("@/server/email/notifications", () => ({
  logNotificationFailure: vi.fn(),
  notifyProjectUpdate: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  createProjectUpdateRecord,
  deleteProjectUpdateRecord,
  getProjectById,
  getProjectNotificationContext,
  listProjectUpdatesForUser,
  updateProjectUpdateRecord,
} from "@/db/records";
import { Route as ProjectUpdateRoute } from "@/routes/api/project-updates/$id";
import { Route as ProjectUpdatesRoute } from "@/routes/api/projects/$id/updates";
import { notifyProjectUpdate } from "@/server/email/notifications";

const updatesHandlers = ProjectUpdatesRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
  POST: (context: unknown) => Promise<Response>;
};

const updateHandlers = ProjectUpdateRoute.options.server?.handlers as {
  DELETE: (context: unknown) => Promise<Response>;
  PATCH: (context: unknown) => Promise<Response>;
};

const adminUser = {
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
  body: "We finished the design review and are moving into build.",
  status: "on_track" as const,
  title: "Design review complete",
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

describe("project update API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectNotificationContext).mockResolvedValue({
      clientCompany: "Acme",
      clientName: "Jordan",
      discussionUrl: "https://clientra.test/projects/acme/project#discussion",
      projectId: "project_1",
      projectTitle: "Delivery Portal",
      projectUrl: "https://clientra.test/projects/acme/project",
      recipients: [],
    });
    vi.mocked(notifyProjectUpdate).mockResolvedValue(undefined);
  });

  it("lets authorized users read project updates", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(clientUser);
    vi.mocked(listProjectUpdatesForUser).mockResolvedValue([
      {
        authorId: "admin_1",
        authorName: "Admin User",
        body: validPayload.body,
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        id: "update_1",
        projectId: "project_1",
        status: "on_track",
        title: validPayload.title,
        updatedAt: new Date("2026-04-01T10:00:00.000Z"),
      },
    ]);

    const response = await updatesHandlers.GET({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/updates"),
    } as never);

    expect(listProjectUpdatesForUser).toHaveBeenCalledWith(
      "project_1",
      clientUser
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      { id: "update_1", title: "Design review complete" },
    ]);
  });

  it("blocks clients from publishing project updates", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(clientUser);

    const response = await updatesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/updates", {
        body: JSON.stringify(validPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(createProjectUpdateRecord).not.toHaveBeenCalled();
  });

  it("lets admins publish project updates", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(getProjectById).mockResolvedValue({
      budget: 12_000,
      clientId: "client_1",
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      deadline: "2026-04-30",
      description: "Delivery portal.",
      id: "project_1",
      slug: "delivery-portal",
      status: "in_progress",
      title: "Delivery Portal",
    });
    vi.mocked(canAccessProject).mockResolvedValue(true);
    vi.mocked(createProjectUpdateRecord).mockResolvedValue({
      authorId: "admin_1",
      authorName: "Admin User",
      body: validPayload.body,
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      id: "update_1",
      projectId: "project_1",
      status: "on_track",
      title: validPayload.title,
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    });

    const response = await updatesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/updates", {
        body: JSON.stringify(validPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(201);
    expect(createProjectUpdateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: "admin_1",
        body: validPayload.body,
        projectId: "project_1",
      })
    );
    expect(notifyProjectUpdate).toHaveBeenCalled();
  });

  it("keeps project update creation successful when notifications fail", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(canAccessProject).mockResolvedValue(true);
    vi.mocked(getProjectById).mockResolvedValue({
      budget: 12_000,
      clientId: "client_1",
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      deadline: "2026-04-30",
      description: "Delivery portal.",
      id: "project_1",
      slug: "delivery-portal",
      status: "in_progress",
      title: "Delivery Portal",
    });
    vi.mocked(createProjectUpdateRecord).mockResolvedValue({
      authorId: "admin_1",
      authorName: "Admin User",
      body: validPayload.body,
      createdAt: new Date("2026-04-01T10:00:00.000Z"),
      id: "update_1",
      projectId: "project_1",
      status: "on_track",
      title: validPayload.title,
      updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    });
    vi.mocked(notifyProjectUpdate).mockRejectedValue(new Error("Loop failed"));

    const response = await updatesHandlers.POST({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1/updates", {
        body: JSON.stringify(validPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(201);
    expect(notifyProjectUpdate).toHaveBeenCalled();
  });

  it("validates update payloads and missing records", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);

    const invalidResponse = await updateHandlers.PATCH({
      params: { id: "update_1" },
      request: createRequest("/api/project-updates/update_1", {
        body: JSON.stringify({ ...validPayload, title: "" }),
        method: "PATCH",
      }),
    } as never);

    expect(invalidResponse.status).toBe(422);
    expect(updateProjectUpdateRecord).not.toHaveBeenCalled();

    vi.mocked(deleteProjectUpdateRecord).mockResolvedValue(false);

    const missingResponse = await updateHandlers.DELETE({
      params: { id: "missing" },
      request: createRequest("/api/project-updates/missing", {
        method: "DELETE",
      }),
    } as never);

    expect(missingResponse.status).toBe(404);
  });
});
