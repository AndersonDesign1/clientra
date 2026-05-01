// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMilestoneStatus,
  ProjectMilestoneList,
} from "@/components/projects/project-milestones-panel";
import type { ProjectMilestone } from "@/lib/api";

const milestones: ProjectMilestone[] = [
  {
    createdAt: "2026-04-01T10:00:00.000Z",
    description: "Approve the final design direction.",
    dueDate: "2026-04-12",
    id: "milestone_1",
    projectId: "project_1",
    sortOrder: 1,
    status: "in_progress",
    title: "Design approval",
    updatedAt: "2026-04-01T10:00:00.000Z",
  },
];

afterEach(() => {
  cleanup();
});

describe("ProjectMilestoneList", () => {
  it("renders milestones without admin controls for clients", () => {
    render(
      <ProjectMilestoneList
        canManage={false}
        milestones={milestones}
        onDelete={() => undefined}
        onEdit={() => undefined}
      />
    );

    expect(screen.getByText("Design approval")).toBeTruthy();
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(
      screen.getByText("Approve the final design direction.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("renders edit and delete actions for admins", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();

    render(
      <ProjectMilestoneList
        canManage
        milestones={milestones}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(milestones[0]);
    expect(onDelete).toHaveBeenCalledWith(milestones[0]);
  });

  it("renders an empty state and readable labels", () => {
    render(
      <ProjectMilestoneList
        canManage={false}
        milestones={[]}
        onDelete={() => undefined}
        onEdit={() => undefined}
      />
    );

    expect(screen.getByText("No milestones yet")).toBeTruthy();
    expect(formatMilestoneStatus("todo")).toBe("To do");
    expect(formatMilestoneStatus("done")).toBe("Done");
  });
});
