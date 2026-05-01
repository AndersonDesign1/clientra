import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  canAccessProject: vi.fn(),
  createProjectNoteRecord: vi.fn(),
  getProjectCollaboration: vi.fn(),
  seedIfEmpty: vi.fn(),
  serializeProjectComment: vi.fn((comment) => comment),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  canAccessProject,
  createProjectNoteRecord,
  getProjectCollaboration,
  seedIfEmpty,
  serializeProjectComment,
} from "@/db/records";
import { Route as NotesRoute } from "@/routes/api/notes";
import { Route as CollaborationRoute } from "@/routes/api/projects/$id/collaboration";

const collaborationHandlers = CollaborationRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
};

const notesHandlers = NotesRoute.options.server?.handlers as {
  POST: (context: unknown) => Promise<Response>;
};

describe("collaboration API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns collaboration data for an authorized user", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });
    vi.mocked(canAccessProject).mockResolvedValue(true);
    vi.mocked(getProjectCollaboration).mockResolvedValue({
      activity: [
        {
          createdAt: "2026-03-01T10:00:00.000Z",
          id: "p",
          type: "project_created",
        },
      ],
      comments: [],
    });

    const response = await collaborationHandlers.GET({
      params: { id: "project_1" },
      request: new Request(
        "https://clientra.test/api/projects/project_1/collaboration"
      ),
    } as never);

    expect(seedIfEmpty).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      activity: [
        {
          createdAt: "2026-03-01T10:00:00.000Z",
          id: "p",
          type: "project_created",
        },
      ],
      comments: [],
    });
  });

  it("rejects collaboration reads for users without project access", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "client_1",
      name: "Client User",
      role: ROLES.CLIENT,
    });
    vi.mocked(canAccessProject).mockResolvedValue(false);

    const response = await collaborationHandlers.GET({
      params: { id: "project_1" },
      request: new Request(
        "https://clientra.test/api/projects/project_1/collaboration"
      ),
    } as never);

    expect(response.status).toBe(403);
  });

  it("allows an admin with access to post an enriched project comment", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });
    vi.mocked(canAccessProject).mockResolvedValue(true);
    vi.mocked(createProjectNoteRecord).mockResolvedValue({
      authorId: "admin_1",
      authorName: "Admin User",
      authorRole: ROLES.ADMIN,
      content: "Admin update",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      id: "note_1",
      projectId: "project_1",
    });
    vi.mocked(serializeProjectComment).mockImplementation((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    }));

    const request = new Request("https://clientra.test/api/notes", {
      body: JSON.stringify({
        content: "Admin update",
        projectId: "project_1",
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://clientra.test",
        "sec-fetch-site": "same-origin",
      },
      method: "POST",
    });

    const response = await notesHandlers.POST({
      request,
    } as never);

    expect(canAccessProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "admin_1" }),
      "project_1"
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      authorName: "Admin User",
      authorRole: ROLES.ADMIN,
      content: "Admin update",
    });
  });

  it("rejects cross-site comment mutations before project access checks", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });

    const response = await notesHandlers.POST({
      request: new Request("https://clientra.test/api/notes", {
        body: JSON.stringify({
          content: "Admin update",
          projectId: "project_1",
        }),
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.test",
          "sec-fetch-site": "cross-site",
        },
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(getSessionUserFromHeaders).not.toHaveBeenCalled();
    expect(canAccessProject).not.toHaveBeenCalled();
    expect(createProjectNoteRecord).not.toHaveBeenCalled();
  });

  it("allows a linked client to post and blocks a client without access", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "client_1",
      name: "Client User",
      role: ROLES.CLIENT,
    });
    vi.mocked(createProjectNoteRecord).mockResolvedValue({
      authorId: "client_1",
      authorName: "Client User",
      authorRole: ROLES.CLIENT,
      content: "Client feedback",
      createdAt: new Date("2026-03-01T10:00:00.000Z"),
      id: "note_2",
      projectId: "project_1",
    });
    vi.mocked(serializeProjectComment).mockImplementation((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
    }));

    const request = new Request("https://clientra.test/api/notes", {
      body: JSON.stringify({
        content: "Client feedback",
        projectId: "project_1",
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://clientra.test",
        "sec-fetch-site": "same-origin",
      },
      method: "POST",
    });

    vi.mocked(canAccessProject).mockResolvedValueOnce(true);

    const allowedResponse = await notesHandlers.POST({
      request,
    } as never);

    expect(allowedResponse.status).toBe(201);

    vi.mocked(canAccessProject).mockResolvedValueOnce(false);

    const blockedRequest = new Request("https://clientra.test/api/notes", {
      body: JSON.stringify({
        content: "Client feedback",
        projectId: "project_1",
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://clientra.test",
        "sec-fetch-site": "same-origin",
      },
      method: "POST",
    });

    const blockedResponse = await notesHandlers.POST({
      request: blockedRequest,
    } as never);

    expect(blockedResponse.status).toBe(403);
  });
});
