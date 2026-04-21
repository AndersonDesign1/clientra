// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DashboardActivityEvent } from "@/lib/api";
import { DashboardActivityList } from "@/routes/dashboard";

afterEach(() => {
  cleanup();
});

describe("DashboardActivityList", () => {
  it("renders dashboard activity items", () => {
    const activity: DashboardActivityEvent[] = [
      {
        authorId: "admin_1",
        authorName: "Admin User",
        contentPreview: "Latest review notes are ready.",
        createdAt: "2026-03-01T10:10:00.000Z",
        id: "comment:note_1",
        projectId: "project_1",
        projectTitle: "Client Portal Refresh",
        type: "comment_added",
      },
      {
        clientId: "client_1",
        clientName: "Jordan Lee",
        company: "Acme Inc.",
        createdAt: "2026-03-01T10:00:00.000Z",
        id: "client:client_1:created",
        type: "client_created",
      },
    ];

    render(<DashboardActivityList activity={activity} />);

    expect(
      screen.getByText("Admin User commented on Client Portal Refresh")
    ).toBeTruthy();
    expect(screen.getByText("Latest review notes are ready.")).toBeTruthy();
    expect(screen.getByText("Client added: Jordan Lee")).toBeTruthy();
    expect(screen.getByText("Acme Inc.")).toBeTruthy();
  });

  it("renders an empty state when there is no dashboard activity", () => {
    render(<DashboardActivityList activity={[]} />);

    expect(screen.getByText("No recent activity")).toBeTruthy();
    expect(
      screen.getByText(
        "New clients, projects, comments, and files will appear here."
      )
    ).toBeTruthy();
  });
});
