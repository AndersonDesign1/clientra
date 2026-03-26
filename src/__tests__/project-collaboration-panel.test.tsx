// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ProjectCollaborationView,
  formatEventTitle,
} from "@/components/projects/project-collaboration-panel";
import type {
  ProjectActivityEvent,
  ProjectCollaborationPayload,
} from "@/lib/api";

const initialActivity: ProjectActivityEvent[] = [
  {
    createdAt: "2026-03-01T10:00:00.000Z",
    id: "project:project_1:created",
    type: "project_created",
  },
];

const initialCollaboration: ProjectCollaborationPayload = {
  activity: initialActivity,
  comments: [],
};

afterEach(() => {
  cleanup();
});

function renderInteractiveCollaborationView() {
  let collaboration = initialCollaboration;
  let content = "";
  let formError: string | null = null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed) {
      formError = "Write a comment before posting.";
      rerenderView();
      return;
    }

    formError = null;

    const nextComment = {
      authorId: "admin_1",
      authorName: "Admin User",
      authorRole: "admin" as const,
      content: trimmed,
      createdAt: "2026-03-01T10:05:00.000Z",
      id: "note_3",
      projectId: "project_1",
    };

    const nextActivity: ProjectActivityEvent = {
      authorId: nextComment.authorId,
      authorName: nextComment.authorName,
      authorRole: nextComment.authorRole,
      contentPreview: trimmed,
      createdAt: nextComment.createdAt,
      id: "note:note_3",
      type: "note_added",
    };

    collaboration = {
      activity: [nextActivity, ...collaboration.activity],
      comments: [nextComment, ...collaboration.comments],
    };
    content = "";
    rerenderView();
  }

  function renderView() {
    return (
      <ProjectCollaborationView
        collaboration={collaboration}
        content={content}
        formError={formError}
        isPosting={false}
        onContentChange={(value) => {
          content = value;
          rerenderView();
        }}
        onSubmit={handleSubmit}
      />
    );
  }

  const view = render(renderView());

  function rerenderView() {
    view.rerender(renderView());
  }

  return view;
}

describe("ProjectCollaborationView", () => {
  it("renders the empty discussion state and initial activity", () => {
    render(
      <ProjectCollaborationView
        collaboration={initialCollaboration}
        content=""
        formError={null}
        isPosting={false}
        onContentChange={() => undefined}
        onSubmit={() => undefined}
      />
    );

    expect(screen.getByText("No discussion yet")).toBeTruthy();
    expect(screen.getByText("Project created")).toBeTruthy();
  });

  it("posts a comment and updates both the thread and activity feed", async () => {
    renderInteractiveCollaborationView();

    fireEvent.change(
      screen.getByPlaceholderText(
        "Post an update, ask a question, or leave feedback..."
      ),
      {
        target: {
          value: "Fresh update from the admin side.",
        },
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(
      await screen.findAllByText("Fresh update from the admin side.")
    ).toHaveLength(2);
    expect(screen.getByText("Admin User added a comment")).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByText("No discussion yet")).toBeNull();
    });
  });

  it("shows a validation error when trying to post an empty comment", async () => {
    renderInteractiveCollaborationView();

    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(
      await screen.findByText("Write a comment before posting.")
    ).toBeTruthy();
  });

  it("formats collaboration activity titles consistently", () => {
    expect(formatEventTitle(initialActivity[0])).toBe("Project created");
    expect(
      formatEventTitle({
        authorId: "admin_1",
        authorName: "Admin User",
        authorRole: "admin",
        contentPreview: "Fresh update from the admin side.",
        createdAt: "2026-03-01T10:05:00.000Z",
        id: "note:note_3",
        type: "note_added",
      })
    ).toBe("Admin User added a comment");
  });
});
