import {
  Briefcase01Icon,
  Clock01Icon,
  Comment01Icon,
  File01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { type FormEvent, useState } from "react";
import { UnifiedActivityList } from "@/components/common/activity-list";
import { PanelSection } from "@/components/common/panel-section";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  isAddOpen: boolean;
  isPosting: boolean;
  onAddOpenChange: (open: boolean) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function ExpandableText({
  text,
  limit = 90,
}: {
  text?: string;
  limit?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return null;
  }

  if (text.length <= limit) {
    return (
      <p className="whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
        {text}
      </p>
    );
  }

  const displayText = isExpanded ? text : `${text.slice(0, limit)}...`;

  return (
    <p className="whitespace-pre-wrap font-normal text-muted-foreground text-xs leading-relaxed">
      {displayText}{" "}
      <button
        className="ml-1 rounded-sm font-bold text-[9px] text-primary uppercase tracking-wider transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? "Show less" : "Read more"}
      </button>
    </p>
  );
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
      return `Status report marked ${event.status?.replaceAll("_", " ") ?? ""}: "${event.title}"`;
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
      return "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900";
    case "note_added":
      return "text-sky-600 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900";
    case "file_uploaded":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900";
    case "project_update":
      return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900";
    default:
      return "text-muted-foreground bg-secondary/50 border border-border/50";
  }
}

export function ProjectCommentForm({
  content,
  formError,
  isPosting,
  onContentChange,
  onCancel,
  onSubmit,
}: {
  content: string;
  formError: string | null;
  isPosting: boolean;
  onContentChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <textarea
        className="min-h-[110px] w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="Post an update, ask a question, or leave feedback..."
        value={content}
      />
      {formError ? (
        <div className="rounded-lg border border-rose-200/50 bg-rose-50/10 p-2.5 text-rose-700 text-xs">
          {formError}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-border/40 border-t pt-2">
        <p className="text-[10px] text-muted-foreground/75 italic">
          Plain-text messages only
        </p>
        <DialogFooter className="gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPosting} type="submit">
            {isPosting ? "Posting..." : "Post comment"}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
}

export function ProjectCollaborationView({
  collaboration,
  content,
  formError,
  isPosting,
  isAddOpen,
  onContentChange,
  onAddOpenChange,
  onSubmit,
}: ProjectCollaborationViewProps) {
  const COMPACT_LIMIT = 4;
  const [expanded, setExpanded] = useState(false);

  const visibleActivity = expanded
    ? collaboration.activity
    : collaboration.activity.slice(0, COMPACT_LIMIT);

  const items = visibleActivity.map((event) => ({
    id: event.id,
    icon: getEventIcon(event.type),
    iconBgClass: getEventIconColor(event.type),
    title: formatEventTitle(event),
    body: formatEventDescription(event),
    time: new Date(event.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    rawItem: event,
  }));

  return (
    <div className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Discussion Column */}
        <PanelSection
          action={
            <Button
              className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onAddOpenChange(true)}
              size="sm"
            >
              Post Comment
            </Button>
          }
          description="Share updates, ask questions, or leave feedback."
          title="Project Discussion"
          variant="ghost"
        >

          {/* Comment Creation Dialog */}
          <Dialog onOpenChange={onAddOpenChange} open={isAddOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Post Comment</DialogTitle>
                <DialogDescription>
                  Post a message or question to the project collaboration
                  thread.
                </DialogDescription>
              </DialogHeader>
              <ProjectCommentForm
                content={content}
                formError={formError}
                isPosting={isPosting}
                onCancel={() => onAddOpenChange(false)}
                onContentChange={onContentChange}
                onSubmit={onSubmit}
              />
            </DialogContent>
          </Dialog>

          <div className="space-y-4 pt-1">
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
                        <ExpandableText text={comment.content} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </PanelSection>

        {/* Activity Timeline Column */}
        <PanelSection
          description="Chronological feed of project events."
          title="Activity Timeline"
          variant="ghost"
        >

          <UnifiedActivityList
            emptyState={
              <EmptyPanel
                description="Project events will appear here as people contribute."
                title="No activity yet"
              />
            }
            items={items}
          />

          {collaboration.activity.length > COMPACT_LIMIT && (
            <div className="mt-3 flex justify-center">
              <Button
                className="h-7 font-medium text-xs"
                onClick={() => setExpanded(!expanded)}
                size="sm"
                variant="ghost"
              >
                {expanded
                  ? "Show less"
                  : `View all ${collaboration.activity.length} events`}
              </Button>
            </div>
          )}
        </PanelSection>
      </div>
    </div>
  );
}

export function ProjectCollaborationPanel({
  projectId,
}: ProjectCollaborationPanelProps) {
  const collaborationQuery = useProjectCollaborationData(projectId);
  const createCommentMutation = useCreateProjectCommentMutation();
  const [content, setContent] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
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
      setIsAddOpen(false);
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
      <div className="rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
        <LoadingPanel
          description="Loading the latest discussion and activity timeline for this project."
          title="Loading discussion"
        />
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
      isAddOpen={isAddOpen}
      isPosting={createCommentMutation.isPending}
      onAddOpenChange={setIsAddOpen}
      onContentChange={setContent}
      onSubmit={handleSubmit}
    />
  );
}
