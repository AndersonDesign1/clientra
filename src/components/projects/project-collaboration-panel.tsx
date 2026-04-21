import { type FormEvent, useState } from "react";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { Button } from "@/components/ui/button";
import {
  type ProjectActivityEvent,
  type ProjectCollaborationPayload,
  useCreateProjectCommentMutation,
  useProjectCollaborationData,
} from "@/lib/api";

interface ProjectCollaborationPanelProps {
  projectId: string;
}

interface ProjectCollaborationViewProps {
  collaboration: ProjectCollaborationPayload;
  content: string;
  formError: string | null;
  isPosting: boolean;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function formatEventTitle(event: ProjectActivityEvent) {
  switch (event.type) {
    case "project_created":
      return "Project created";
    case "note_added":
      return `${event.authorName} added a comment`;
    case "file_uploaded":
      return `${event.authorName} uploaded ${event.fileName}`;
    default:
      return "Project activity";
  }
}

export function formatEventDescription(event: ProjectActivityEvent) {
  switch (event.type) {
    case "project_created":
      return "The collaboration history starts here.";
    case "note_added":
      return event.contentPreview;
    case "file_uploaded":
      return "File shared with everyone who can access this project.";
    default:
      return "Project activity was updated.";
  }
}

export function ProjectCollaborationView({
  collaboration,
  content,
  formError,
  isPosting,
  onContentChange,
  onSubmit,
}: ProjectCollaborationViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-xl border bg-white p-4">
        <div className="mb-4">
          <h2 className="font-medium text-lg text-slate-900">
            Project discussion
          </h2>
          <p className="mt-1 text-slate-600 text-sm">
            Share updates and decisions with everyone who can access this
            project.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400"
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Post an update, ask a question, or leave feedback..."
            value={content}
          />
          {formError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              {formError}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-500 text-xs">
              Plain-text comments only for v1.
            </p>
            <Button disabled={isPosting} type="submit">
              {isPosting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {collaboration.comments.length === 0 ? (
            <EmptyPanel
              description="Be the first person to post an update on this project."
              title="No discussion yet"
            />
          ) : (
            collaboration.comments.map((comment) => (
              <article
                className="rounded-xl border border-slate-200 p-4"
                key={comment.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {comment.authorName}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em]">
                    {comment.authorRole}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-slate-700 text-sm leading-6">
                  {comment.content}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-4">
          <h2 className="font-medium text-lg text-slate-900">
            Activity timeline
          </h2>
          <p className="mt-1 text-slate-600 text-sm">
            Follow the latest project events in one place.
          </p>
        </div>

        {collaboration.activity.length === 0 ? (
          <EmptyPanel
            description="Project events will appear here as people contribute."
            title="No activity yet"
          />
        ) : (
          <ol className="space-y-3">
            {collaboration.activity.map((event) => (
              <li
                className="rounded-xl border border-slate-200 p-4"
                key={event.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {formatEventTitle(event)}
                  </p>
                  <span className="text-slate-500 text-xs">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-slate-600 text-sm leading-6">
                  {formatEventDescription(event)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function ProjectCollaborationPanel({
  projectId,
}: ProjectCollaborationPanelProps) {
  const collaborationQuery = useProjectCollaborationData(projectId);
  const createCommentMutation = useCreateProjectCommentMutation();
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed) {
      setFormError("Write a comment before posting.");
      return;
    }

    setFormError(null);

    try {
      await createCommentMutation.mutateAsync({
        content: trimmed,
        projectId,
      });
      setContent("");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to post that comment right now."
      );
    }
  }

  if (collaborationQuery.isLoading && !collaborationQuery.data) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border bg-white p-4">
          <LoadingPanel
            description="Loading the latest discussion for this project."
            title="Loading discussion"
          />
        </section>
        <section className="rounded-xl border bg-white p-4">
          <LoadingPanel
            description="Loading recent project activity."
            title="Loading activity"
          />
        </section>
      </div>
    );
  }

  if (collaborationQuery.error && !collaborationQuery.data) {
    return <ErrorPanel description={collaborationQuery.error} />;
  }

  const collaboration = collaborationQuery.data ?? {
    activity: [],
    comments: [],
  };

  return (
    <ProjectCollaborationView
      collaboration={collaboration}
      content={content}
      formError={formError}
      isPosting={createCommentMutation.isPending}
      onContentChange={setContent}
      onSubmit={handleSubmit}
    />
  );
}
