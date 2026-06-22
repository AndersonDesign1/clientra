import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/auth/roles";

vi.mock("@/auth/session.server", () => ({
  getSessionUserFromHeaders: vi.fn(),
}));

vi.mock("@/db/records", () => ({
  getPortalSummary: vi.fn(),
}));

import { getSessionUserFromHeaders } from "@/auth/session.server";
import { getPortalSummary } from "@/db/records";
import { Route as PortalSummaryRoute } from "@/routes/api/portal/summary";

const handlers = PortalSummaryRoute.options.server?.handlers as {
  GET: (context: unknown) => Promise<Response>;
};

describe("portal summary API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects admin callers before loading portal summary data", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      activeOrganizationId: "org_1",
      email: "admin@example.com",
      id: "admin_1",
      name: "Admin User",
      role: ROLES.ADMIN,
    });

    const response = await handlers.GET({
      request: new Request("https://clientra.test/api/portal/summary"),
    } as never);

    expect(response.status).toBe(403);
    expect(getPortalSummary).not.toHaveBeenCalled();
  });

  it("returns portal summary for linked client users", async () => {
    vi.mocked(getSessionUserFromHeaders).mockResolvedValue({
      email: "client@example.com",
      id: "client_user",
      name: "Client User",
      role: ROLES.CLIENT,
    });
    vi.mocked(getPortalSummary).mockResolvedValue({
      activeProjects: [],
      latestUpdates: [],
      projectCount: 0,
      recentFiles: [],
      upcomingMilestones: [],
    });

    const response = await handlers.GET({
      request: new Request("https://clientra.test/api/portal/summary"),
    } as never);

    expect(response.status).toBe(200);
    expect(getPortalSummary).toHaveBeenCalled();
  });
});
