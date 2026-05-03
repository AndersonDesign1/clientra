import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  createInviteRecord: vi.fn(),
  getActiveInviteById: vi.fn(),
  getClientById: vi.fn(),
  getInviteRecordById: vi.fn(),
  refreshInviteExpiration: vi.fn(),
  revokeInviteRecord: vi.fn(),
}));

vi.mock("@/server/email/notifications", () => ({
  sendInviteEmail: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import {
  createInviteRecord,
  getActiveInviteById,
  getClientById,
  getInviteRecordById,
  refreshInviteExpiration,
  revokeInviteRecord,
} from "@/db/records";
import { Route as InvitesRoute } from "@/routes/api/invites";
import { Route as ResendInviteRoute } from "@/routes/api/invites/$id/resend";
import { Route as RevokeInviteRoute } from "@/routes/api/invites/$id/revoke";
import { sendInviteEmail } from "@/server/email/notifications";

const inviteHandlers = InvitesRoute.options.server?.handlers as {
  POST: (context: unknown) => Promise<Response>;
};
const resendHandlers = ResendInviteRoute.options.server?.handlers as {
  POST: (context: unknown) => Promise<Response>;
};
const revokeHandlers = RevokeInviteRoute.options.server?.handlers as {
  POST: (context: unknown) => Promise<Response>;
};

const adminUser = {
  email: "admin@example.com",
  id: "admin_1",
  name: "Admin User",
  role: ROLES.ADMIN,
};

const client = {
  company: "Acme",
  email: "jordan@example.com",
  id: "client_1",
  name: "Jordan",
};

const invite = {
  clientId: "client_1",
  consumedAt: null,
  createdAt: new Date("2026-04-01T10:00:00.000Z"),
  email: "jordan@example.com",
  expiresAt: new Date("2026-04-08T10:00:00.000Z"),
  id: "invite_1",
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

describe("invite management API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(adminUser);
    vi.mocked(getClientById).mockResolvedValue(client as never);
    vi.mocked(getInviteRecordById).mockResolvedValue(invite);
    vi.mocked(getActiveInviteById).mockResolvedValue(invite);
    vi.mocked(refreshInviteExpiration).mockResolvedValue(invite);
    vi.mocked(revokeInviteRecord).mockResolvedValue(invite);
    vi.mocked(sendInviteEmail).mockResolvedValue({ skipped: false });
  });

  it("blocks invite creation when Loop invite email fails", async () => {
    vi.mocked(sendInviteEmail).mockRejectedValue(new Error("Loop failed"));

    const response = await inviteHandlers.POST({
      request: createRequest("/api/invites", {
        body: JSON.stringify({
          clientId: "client_1",
          email: "jordan@example.com",
        }),
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(500);
    expect(createInviteRecord).toHaveBeenCalled();
    expect(sendInviteEmail).toHaveBeenCalled();
  });

  it("resends an active invite and blocks when Loop fails", async () => {
    vi.mocked(sendInviteEmail).mockRejectedValue(new Error("Loop failed"));

    const response = await resendHandlers.POST({
      params: { id: "invite_1" },
      request: createRequest("/api/invites/invite_1/resend", {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(500);
    expect(refreshInviteExpiration).toHaveBeenCalledWith(
      "invite_1",
      expect.any(Date)
    );
    expect(sendInviteEmail).toHaveBeenCalled();
  });

  it("revokes active pending invites", async () => {
    const response = await revokeHandlers.POST({
      params: { id: "invite_1" },
      request: createRequest("/api/invites/invite_1/revoke", {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(revokeInviteRecord).toHaveBeenCalledWith("invite_1");
  });

  it("rejects cross-site resend requests before touching records", async () => {
    const response = await resendHandlers.POST({
      params: { id: "invite_1" },
      request: createRequest("/api/invites/invite_1/resend", {
        headers: {
          origin: "https://evil.test",
          "sec-fetch-site": "cross-site",
        },
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(getActiveInviteById).not.toHaveBeenCalled();
  });

  it("rejects non-admin revoke requests", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "client_user",
      name: "Client User",
      role: ROLES.CLIENT,
    });

    const response = await revokeHandlers.POST({
      params: { id: "invite_1" },
      request: createRequest("/api/invites/invite_1/revoke", {
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(revokeInviteRecord).not.toHaveBeenCalled();
  });
});
