// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PortalSummary } from "@/lib/api";
import { PortalSummaryView } from "@/routes/portal/index";

const summary: PortalSummary = {
  activeProjects: [
    {
      budget: 12_000,
      clientId: "client_1",
      deadline: "2026-04-30",
      description: "Delivery portal.",
      id: "project_1",
      slug: "delivery-portal",
      status: "in_progress",
      title: "Delivery Portal",
    },
  ],
  latestUpdates: [
    {
      authorId: "admin_1",
      authorName: "Admin User",
      body: "Design review is complete and build work is now underway.",
      createdAt: "2026-04-01T10:00:00.000Z",
      id: "update_1",
      projectId: "project_1",
      projectTitle: "Delivery Portal",
      status: "on_track",
      title: "Design review complete",
      updatedAt: "2026-04-01T10:00:00.000Z",
    },
  ],
  projectCount: 1,
  recentFiles: [
    {
      createdAt: "2026-04-02T10:00:00.000Z",
      fileName: "brief.pdf",
      fileSize: 2048,
      fileUrl: "https://example.com/brief.pdf",
      id: "file_1",
      mimeType: "application/pdf",
      projectId: "project_1",
      projectTitle: "Delivery Portal",
      uploadedBy: "admin_1",
      uploaderName: "Admin User",
    },
  ],
  upcomingMilestones: [
    {
      createdAt: "2026-04-01T10:00:00.000Z",
      description: "Approve the final design direction.",
      dueDate: "2026-04-12",
      id: "milestone_1",
      projectId: "project_1",
      projectTitle: "Delivery Portal",
      sortOrder: 1,
      status: "in_progress",
      title: "Design approval",
      updatedAt: "2026-04-01T10:00:00.000Z",
    },
  ],
};

afterEach(() => {
  cleanup();
});

describe("PortalSummaryView", () => {
  it("surfaces active work, updates, milestones, and files", () => {
    render(<PortalSummaryView summary={summary} />);

    expect(screen.getByText("Active work")).toBeTruthy();
    expect(screen.getByText("Delivery Portal")).toBeTruthy();
    expect(screen.getByText("Design review complete")).toBeTruthy();
    expect(screen.getByText("Design approval")).toBeTruthy();
    expect(screen.getByText("brief.pdf")).toBeTruthy();
    expect(screen.getByText("1 active / 1 total")).toBeTruthy();
  });

  it("renders useful empty states", () => {
    render(
      <PortalSummaryView
        summary={{
          activeProjects: [],
          latestUpdates: [],
          projectCount: 0,
          recentFiles: [],
          upcomingMilestones: [],
        }}
      />
    );

    expect(screen.getByText("No active projects")).toBeTruthy();
    expect(screen.getByText("No updates yet")).toBeTruthy();
    expect(screen.getByText("No upcoming milestones")).toBeTruthy();
    expect(screen.getByText("No files yet")).toBeTruthy();
  });
});
