// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatProjectUpdateStatus,
  ProjectUpdateList,
} from "@/components/projects/project-updates-panel";
import type { ProjectUpdate } from "@/lib/api";

const updates: ProjectUpdate[] = [
  {
    authorId: "admin_1",
    authorName: "Admin User",
    body: "Design review is complete and build work is now underway.",
    createdAt: "2026-04-01T10:00:00.000Z",
    id: "update_1",
    projectId: "project_1",
    status: "on_track",
    title: "Design review complete",
    updatedAt: "2026-04-01T10:00:00.000Z",
  },
];

afterEach(() => {
  cleanup();
});

describe("ProjectUpdateList", () => {
  it("renders project updates for clients without management actions", () => {
    render(
      <ProjectUpdateList
        canManage={false}
        onDelete={() => undefined}
        onEdit={() => undefined}
        updates={updates}
      />
    );

    expect(screen.getByText("Design review complete")).toBeTruthy();
    expect(screen.getByText("On track")).toBeTruthy();
    expect(
      screen.getByText(
        "Design review is complete and build work is now underway."
      )
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("renders management actions for admins", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    render(
      <ProjectUpdateList
        canManage
        onDelete={onDelete}
        onEdit={onEdit}
        updates={updates}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(updates[0]);
    expect(onDelete).toHaveBeenCalledWith(updates[0]);
  });

  it("renders an empty state and readable status labels", () => {
    render(
      <ProjectUpdateList
        canManage={false}
        onDelete={() => undefined}
        onEdit={() => undefined}
        updates={[]}
      />
    );

    expect(screen.getByText("No project updates yet")).toBeTruthy();
    expect(formatProjectUpdateStatus("at_risk")).toBe("At risk");
    expect(formatProjectUpdateStatus("complete")).toBe("Complete");
  });
});
