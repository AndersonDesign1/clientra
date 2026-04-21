import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  listDashboardActivity: vi.fn(),
  seedIfEmpty: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import { listDashboardActivity, seedIfEmpty } from "@/db/records";
import { Route as DashboardActivityRoute } from "@/routes/api/dashboard/activity";

const handlers = DashboardActivityRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
};

describe("dashboard activity API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns activity for an admin user", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });
    vi.mocked(listDashboardActivity).mockResolvedValue([
      {
        clientId: "client_1",
        clientName: "Jordan Lee",
        company: "Acme Inc.",
        createdAt: "2026-03-01T10:00:00.000Z",
        id: "client:client_1:created",
        type: "client_created",
      },
    ]);

    const response = await handlers.GET({
      request: new Request("https://clientra.test/api/dashboard/activity"),
    } as never);

    expect(seedIfEmpty).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        clientId: "client_1",
        clientName: "Jordan Lee",
        company: "Acme Inc.",
        createdAt: "2026-03-01T10:00:00.000Z",
        id: "client:client_1:created",
        type: "client_created",
      },
    ]);
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue(null);

    const response = await handlers.GET({
      request: new Request("https://clientra.test/api/dashboard/activity"),
    } as never);

    expect(response.status).toBe(401);
    expect(seedIfEmpty).not.toHaveBeenCalled();
    expect(listDashboardActivity).not.toHaveBeenCalled();
  });

  it("rejects client users", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "client_1",
      name: "Client User",
      role: ROLES.CLIENT,
    });

    const response = await handlers.GET({
      request: new Request("https://clientra.test/api/dashboard/activity"),
    } as never);

    expect(response.status).toBe(403);
    expect(seedIfEmpty).not.toHaveBeenCalled();
    expect(listDashboardActivity).not.toHaveBeenCalled();
  });
});
