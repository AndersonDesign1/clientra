import {
  Briefcase01Icon,
  Clock01Icon,
  Comment01Icon,
  File01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { cn } from "@/lib/utils";

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
      return `${event.authorName} uploaded a file`;
    case "project_update":
      return `${event.authorName} published an update`;
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
      return `Shared file: ${event.fileName}`;
    case "project_update":
      return `Status report marked ${event.status.replaceAll("_", " ")}: "${event.title}"`;
    default:
      return "Project activity was updated.";
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case "project_created":
      return Briefcase01Icon;
    case "note_added":
      return Comment01Icon;
    case "file_uploaded":
      return File01Icon;
    case "project_update":
      return Clock01Icon;
    default:
      return UserGroupIcon;
  }
}

function getEventIconColor(type: string) {
  switch (type) {
    case "project_created":
      return "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900";
    case "note_added":
      return "text-primary bg-primary/10 border-primary/20";
    case "file_uploaded":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
    case "project_update":
      return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
    default:
      return "text-muted-foreground bg-secondary/50 border-border/50";
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
    <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Discussion Column */}
      <section className="space-y-5">
        <div className="border-border/40 border-b pb-4">
          <h2 className="font-semibold text-base text-foreground">
            Project Discussion
          </h2>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            Share updates, ask questions, or leave feedback with the team.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <textarea
            className="min-h-[96px] w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Post an update, ask a question, or leave feedback..."
            value={content}
          />
          {formError ? (
            <div className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-2.5 text-rose-700 text-xs">
              {formError}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground/75 italic">
              Plain-text messages only
            </p>
            <Button disabled={isPosting} size="sm" type="submit">
              {isPosting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>

        <div className="space-y-4 border-border/20 border-t pt-4">
          {collaboration.comments.length === 0 ? (
            <EmptyPanel
              description="Be the first person to post an update on this project."
              title="No discussion yet"
            />
          ) : (
            <div className="divide-y divide-border/15">
              {collaboration.comments.map((comment) => {
                const isAdmin = comment.authorRole?.toLowerCase() === "admin";
                const initials = comment.authorName
                  ? comment.authorName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U";

                return (
                  <article
                    className="flex animate-slide-up-fade items-start gap-3.5 py-4 first:pt-0 last:pb-0"
                    key={comment.id}
                  >
                    {/* Circle Avatar Initials with beautiful gradient */}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-[10px] text-white shadow-sm",
                        isAdmin
                          ? "bg-gradient-to-br from-emerald-600 to-teal-800"
                          : "bg-gradient-to-br from-blue-600 to-sky-700"
                      )}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#08361f] text-xs dark:text-foreground">
                            {comment.authorName}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1 py-0.2 font-bold text-[8px] uppercase tracking-wider",
                              isAdmin
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            )}
                          >
                            {comment.authorRole}
                          </span>
                        </div>
                        <span className="font-medium text-[9px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Activity Timeline Column */}
      <section className="space-y-5">
        <div className="border-border/40 border-b pb-4">
          <h2 className="font-semibold text-base text-foreground">
            Activity Timeline
          </h2>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            A comprehensive chronological view of project milestones.
          </p>
        </div>

        {collaboration.activity.length === 0 ? (
          <EmptyPanel
            description="Project events will appear here as people contribute."
            title="No activity yet"
          />
        ) : (
          <div className="relative mt-2 ml-2.5 space-y-4 border-border/25 border-l pl-5">
            {collaboration.activity.map((event) => {
              const IconComponent = getEventIcon(event.type);
              const iconStyles = getEventIconColor(event.type);

              return (
                <div
                  className="group relative animate-slide-up-fade space-y-0.5"
                  key={event.id}
                >
                  {/* Event Node Icon */}
                  <div
                    className={cn(
                      "absolute top-0.5 -left-[27.5px] flex h-4.5 w-4.5 items-center justify-center rounded-full border bg-background ring-4 ring-background transition-all duration-300",
                      iconStyles
                    )}
                  >
                    <HugeiconsIcon icon={IconComponent} size={8} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-foreground text-xs leading-tight">
                        {formatEventTitle(event)}
                      </span>
                      <span className="font-medium text-[9px] text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 font-normal text-[11px] text-muted-foreground leading-relaxed">
                      {formatEventDescription(event)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border/60 bg-card p-6 shadow-none">
          <LoadingPanel
            description="Loading the latest discussion for this project."
            title="Loading discussion"
          />
        </section>
        <section className="rounded-xl border border-border/60 bg-card p-6 shadow-none">
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
