import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  createPortalColleagueInvite: vi.fn(),
  listPortalTeam: vi.fn(),
}));

vi.mock("@/server/email/notifications", () => ({
  sendInviteEmail: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import { createPortalColleagueInvite, listPortalTeam } from "@/db/records";
import { Route as PortalTeamRoute } from "@/routes/api/portal/team";
import { sendInviteEmail } from "@/server/email/notifications";

const portalTeamHandlers = PortalTeamRoute.options.server?.handlers as {
  POST: (context: unknown) => Promise<Response>;
};

const clientUser = {
  email: "client@example.com",
  id: "client_user",
  name: "Client User",
  role: ROLES.CLIENT,
};

const createdInvite = {
  adminApprovedAt: null,
  clientId: "client_1",
  consumedAt: null,
  createdAt: new Date("2026-06-06T10:00:00.000Z"),
  email: "colleague@example.com",
  expiresAt: new Date("2026-06-13T10:00:00.000Z"),
  id: "invite_colleague",
  initiatedByClientId: "client_1",
  revokedAt: null,
  token: "secret-token",
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

describe("portal team API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(clientUser);
    vi.mocked(listPortalTeam).mockResolvedValue({
      clientId: "client_1",
      members: [],
      pendingInvites: [],
    });
    vi.mocked(createPortalColleagueInvite).mockImplementation(
      async (input) => ({
        ...createdInvite,
        email: input.email,
        id: input.id,
      })
    );
  });

  it("creates colleague invites without sending email before approval", async () => {
    const response = await portalTeamHandlers.POST({
      request: createRequest("/api/portal/team", {
        body: JSON.stringify({
          email: "colleague@example.com",
        }),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(201);
    expect(createPortalColleagueInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client_1",
        email: "colleague@example.com",
        initiatedByClientId: "client_1",
      })
    );
    expect(sendInviteEmail).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body).toMatchObject({
      adminApprovedAt: null,
      clientId: "client_1",
      email: "colleague@example.com",
      initiatedByClientId: "client_1",
    });
    expect(body.id).toEqual(expect.any(String));
    expect(body).not.toHaveProperty("token");
  });

  it("returns 200 without leaking the token for duplicate pending invites", async () => {
    vi.mocked(createPortalColleagueInvite).mockResolvedValue({
      ...createdInvite,
      id: "invite_existing",
    });

    const response = await portalTeamHandlers.POST({
      request: createRequest("/api/portal/team", {
        body: JSON.stringify({
          email: "colleague@example.com",
        }),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).not.toHaveProperty("token");
    expect(body.id).toBe("invite_existing");
  });
});
