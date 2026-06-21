import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  adminOwnsClient: vi.fn(),
  listPendingInvitesForClient: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import { adminOwnsClient, listPendingInvitesForClient } from "@/db/records";
import { Route as PendingInvitesRoute } from "@/routes/api/clients/$id/invites";

const pendingInvitesHandlers = PendingInvitesRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
};

function createRequest(path: string) {
  return new Request(`https://clientra.test${path}`);
}

describe("pending invite API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminOwnsClient).mockResolvedValue(true);
    vi.mocked(listPendingInvitesForClient).mockResolvedValue([]);
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(null);

    const response = await pendingInvitesHandlers.GET({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1/invites"),
    } as never);

    expect(response.status).toBe(401);
    expect(listPendingInvitesForClient).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "user_1",
      name: "Client User",
      role: ROLES.CLIENT,
    });

    const response = await pendingInvitesHandlers.GET({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1/invites"),
    } as never);

    expect(response.status).toBe(403);
    expect(listPendingInvitesForClient).not.toHaveBeenCalled();
  });

  it("rejects pending invite reads outside the active organization", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      activeOrganizationId: "org_1",
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });
    vi.mocked(adminOwnsClient).mockResolvedValue(false);

    const response = await pendingInvitesHandlers.GET({
      params: { id: "client_other_org" },
      request: createRequest("/api/clients/client_other_org/invites"),
    } as never);

    expect(response.status).toBe(404);
    expect(listPendingInvitesForClient).not.toHaveBeenCalled();
  });

  it("returns sanitized pending invites for admins", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });
    vi.mocked(listPendingInvitesForClient).mockResolvedValue([
      {
        clientId: "client_1",
        consumedAt: null,
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        email: "jordan@example.com",
        expiresAt: new Date("2026-04-08T10:00:00.000Z"),
        id: "invite_1",
        revokedAt: null,
        token: "secret-token",
        initiatedByClientId: null,
        adminApprovedAt: null,
      },
    ]);

    const response = await pendingInvitesHandlers.GET({
      params: { id: "client_1" },
      request: createRequest("/api/clients/client_1/invites"),
    } as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(listPendingInvitesForClient).toHaveBeenCalledWith("client_1");
    expect(data).toEqual([
      {
        adminApprovedAt: null,
        clientId: "client_1",
        createdAt: "2026-04-01T10:00:00.000Z",
        email: "jordan@example.com",
        expiresAt: "2026-04-08T10:00:00.000Z",
        id: "invite_1",
        initiatedByClientId: null,
      },
    ]);
  });
});
