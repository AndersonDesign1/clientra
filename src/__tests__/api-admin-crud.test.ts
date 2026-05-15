import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("uploadthing/server", () => ({
  UTApi: class UTApiMock {
    deleteFiles = vi.fn().mockResolvedValue({ success: true });
  },
}));

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  createProjectRecord: vi.fn(),
  deleteClientRecord: vi.fn(),
  deleteProjectRecord: vi.fn(),
  DuplicateProjectSlugError: class DuplicateProjectSlugError extends Error {
    constructor() {
      super("A project with this name already exists for this client.");
      this.name = "DuplicateProjectSlugError";
    }
  },
  listClientStorageKeys: vi.fn(),
  listProjectsForUser: vi.fn(),
  listProjectStorageKeys: vi.fn(),
  seedIfEmpty: vi.fn(),
  updateClientRecord: vi.fn(),
  updateProjectRecord: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createProjectRecord,
  DuplicateProjectSlugError,
  deleteClientRecord,
  deleteProjectRecord,
  listClientStorageKeys,
  listProjectStorageKeys,
  listProjectsForUser,
  seedIfEmpty,
  updateClientRecord,
  updateProjectRecord,
} from "@/db/records";
import { Route as ClientRoute } from "@/routes/api/clients/$id";
import { Route as ProjectsRoute } from "@/routes/api/projects";
import { Route as ProjectRoute } from "@/routes/api/projects/$id";

const clientHandlers = ClientRoute.options.server?.handlers as {
  DELETE: (context: unknown) => Promise<Response>;
  PATCH: (context: unknown) => Promise<Response>;
};

const projectHandlers = ProjectRoute.options.server?.handlers as {
  DELETE: (context: unknown) => Promise<Response>;
  PATCH: (context: unknown) => Promise<Response>;
};

const projectsHandlers = ProjectsRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
  POST: (context: unknown) => Promise<Response>;
};

const adminUser = {
  email: "admin@example.com",
  id: "admin_1",
  name: "Admin User",
  role: ROLES.ADMIN,
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

const validClientPayload = {
  company: "Acme Inc.",
  email: "jordan@acme.co",
  name: "Jordan Lee",
  notes: "Primary stakeholder.",
  phone: "+1 555-0101",
  status: "active" as const,
  tags: ["retainer"],
  website: "https://acme.co",
};

const validProjectPayload = {
  budget: 12_000,
  clientId: "client_1",
  deadline: "2026-04-30",
  description: "Delivery portal.",
  status: "in_progress" as const,
  title: "Client Portal",
};

describe("admin CRUD API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listClientStorageKeys).mockResolvedValue([]);
    vi.mocked(listProjectStorageKeys).mockResolvedValue([]);
    vi.mocked(listProjectsForUser).mockResolvedValue([]);
    vi.mocked(seedIfEmpty).mockResolvedValue(undefined);
  });

  it("rejects unauthenticated client updates", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(null);

    const response = await clientHandlers.PATCH({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1", {
        body: JSON.stringify(validClientPayload),
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(401);
  });

  it("rejects cross-site client mutations before reading the session", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);

    const response = await clientHandlers.PATCH({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1", {
        body: JSON.stringify(validClientPayload),
        headers: {
          origin: "https://attacker.test",
          "sec-fetch-site": "cross-site",
        },
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(getSessionUserFromHeaders).not.toHaveBeenCalled();
    expect(updateClientRecord).not.toHaveBeenCalled();
  });

  it("rejects navigation-style client mutations without an origin", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);

    const response = await clientHandlers.PATCH({
      params: { id: "client_1" },
      request: new Request("https://clientra.test/api/clients/client_1", {
        body: JSON.stringify(validClientPayload),
        headers: {
          "content-type": "application/json",
          "sec-fetch-site": "none",
        },
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(getSessionUserFromHeaders).not.toHaveBeenCalled();
    expect(updateClientRecord).not.toHaveBeenCalled();
  });

  it("rejects non-admin project deletes", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "user_1",
      name: "Client User",
      role: ROLES.CLIENT,
    });

    const response = await projectHandlers.DELETE({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1", {
        method: "DELETE",
      }),
    } as never);

    expect(response.status).toBe(403);
  });

  it("rejects invalid client update payloads", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);

    const response = await clientHandlers.PATCH({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1", {
        body: JSON.stringify({ ...validClientPayload, email: "not-email" }),
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(422);
    expect(updateClientRecord).not.toHaveBeenCalled();
  });

  it("updates a client for an admin", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(updateClientRecord).mockResolvedValue({
      id: "client_1",
      ...validClientPayload,
    });

    const response = await clientHandlers.PATCH({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1", {
        body: JSON.stringify(validClientPayload),
        method: "PATCH",
      }),
    } as never);

    expect(updateClientRecord).toHaveBeenCalledWith("client_1", {
      id: "client_1",
      ...validClientPayload,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      company: "Acme Inc.",
      id: "client_1",
    });
  });

  it("returns 404 when a client update misses", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(updateClientRecord).mockResolvedValue(null);

    const response = await clientHandlers.PATCH({
      params: { id: "missing" },
      request: createRequest("/api/clients/missing", {
        body: JSON.stringify(validClientPayload),
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(404);
  });

  it("deletes a client for an admin", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(deleteClientRecord).mockResolvedValue(true);

    const response = await clientHandlers.DELETE({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1", {
        method: "DELETE",
      }),
    } as never);

    expect(deleteClientRecord).toHaveBeenCalledWith("client_1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("updates a project for an admin", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(updateProjectRecord).mockResolvedValue({
      id: "project_1",
      slug: "client-portal",
      ...validProjectPayload,
    });

    const response = await projectHandlers.PATCH({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1", {
        body: JSON.stringify(validProjectPayload),
        method: "PATCH",
      }),
    } as never);

    expect(updateProjectRecord).toHaveBeenCalledWith("project_1", {
      id: "project_1",
      ...validProjectPayload,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "project_1",
      title: "Client Portal",
    });
  });

  it("returns 409 when creating a duplicate project name under a client", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(createProjectRecord).mockRejectedValue(
      new DuplicateProjectSlugError()
    );

    const response = await projectsHandlers.POST({
      request: createRequest("/api/projects", {
        body: JSON.stringify(validProjectPayload),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "A project with this name already exists for this client.",
    });
  });

  it("returns 409 when renaming into another project under the same client", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(updateProjectRecord).mockRejectedValue(
      new DuplicateProjectSlugError()
    );

    const response = await projectHandlers.PATCH({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1", {
        body: JSON.stringify(validProjectPayload),
        method: "PATCH",
      }),
    } as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "A project with this name already exists for this client.",
    });
  });

  it("returns 404 when a project delete misses", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(deleteProjectRecord).mockResolvedValue(false);

    const response = await projectHandlers.DELETE({
      params: { id: "missing" },
      request: createRequest("/api/projects/missing", {
        method: "DELETE",
      }),
    } as never);

    expect(response.status).toBe(404);
  });

  it("deletes a project for an admin", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(deleteProjectRecord).mockResolvedValue(true);

    const response = await projectHandlers.DELETE({
      params: { id: "project_1" },
      request: createRequest("/api/projects/project_1", {
        method: "DELETE",
      }),
    } as never);

    expect(deleteProjectRecord).toHaveBeenCalledWith("project_1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
