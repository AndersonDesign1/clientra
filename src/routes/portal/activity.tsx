import {
  ArrowRight01Icon,
  Clock01Icon,
  Comment01Icon,
  FileUploadIcon,
  NotificationSquareIcon,
} from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { requireClientSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import type { ProjectComment, ProjectFile, ProjectUpdate } from "@/lib/api";
import {
  ensurePortalActivityData,
  type PortalActivityItem,
  usePortalActivityData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal/activity")({
  beforeLoad: requireClientSession,
  loader: ({ context }) => ensurePortalActivityData(context.queryClient),
  component: PortalActivityPage,
});

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - Date.parse(dateStr);
  const min = Math.floor(diff / 60_000);
  if (min < 1) {
    return "just now";
  }
  if (min < 60) {
    return `${min}m ago`;
  }
  const hrs = Math.floor(min / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(dateStr).toLocaleDateString();
}

const updateStatusColors: Record<string, string> = {
  on_track:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  at_risk:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  blocked: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  complete: "bg-primary/10 text-primary",
};

const updateStatusLabels: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  blocked: "Blocked",
  complete: "Complete",
};

function ActivityCard({ item }: { item: PortalActivityItem }) {
  const isComment = item.type === "comment";
  const isUpdate = item.type === "update";
  const isFile = item.type === "file";

  const comment = isComment ? (item.data as ProjectComment) : null;
  const update = isUpdate ? (item.data as ProjectUpdate) : null;
  const file = isFile ? (item.data as ProjectFile) : null;

  return (
    <div className="group flex gap-3 rounded-xl border border-border/40 bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.015)] transition-colors duration-150 hover:bg-secondary/5">
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
          isComment &&
            "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/20",
          isUpdate && "border-primary/30 bg-primary/10 text-primary",
          isFile &&
            "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-900 dark:bg-teal-950/20"
        )}
      >
        <HugeiconsIcon
          icon={
            isComment
              ? Comment01Icon
              : isFile
                ? FileUploadIcon
                : NotificationSquareIcon
          }
          size={14}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {isComment && comment && (
              <>
                <span className="font-bold text-foreground text-xs">
                  {comment.authorName}
                </span>
                <span className="text-muted-foreground text-xs">
                  left a note on
                </span>
                <span className="font-semibold text-primary text-xs">
                  {item.projectTitle}
                </span>
              </>
            )}
            {isUpdate && update && (
              <>
                <span className="font-bold text-foreground text-xs">
                  {update.authorName}
                </span>
                <span className="text-muted-foreground text-xs">
                  posted an update on
                </span>
                <span className="font-semibold text-primary text-xs">
                  {item.projectTitle}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider",
                    updateStatusColors[update.status] ??
                      "bg-secondary text-foreground"
                  )}
                >
                  {updateStatusLabels[update.status] ?? update.status}
                </span>
              </>
            )}
            {isFile && file && (
              <>
                <span className="font-bold text-foreground text-xs">
                  {file.uploaderName}
                </span>
                <span className="text-muted-foreground text-xs">uploaded</span>
                <span className="max-w-[200px] truncate font-bold text-foreground text-xs">
                  {file.fileName}
                </span>
                <span className="text-muted-foreground text-xs">to</span>
                <span className="font-semibold text-primary text-xs">
                  {item.projectTitle}
                </span>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/60">
            <HugeiconsIcon icon={Clock01Icon} size={10} />
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>

        {/* Preview */}
        {isComment && comment && (
          <p className="mt-1.5 line-clamp-2 rounded-lg bg-secondary/20 px-2.5 py-1.5 text-muted-foreground text-xs leading-relaxed">
            {comment.content}
          </p>
        )}
        {isUpdate && update && (
          <div className="mt-1.5">
            <p className="font-semibold text-foreground text-xs">
              {update.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {update.body}
            </p>
          </div>
        )}
        {isFile && file && (
          <a
            className="mt-1.5 inline-flex items-center gap-1 font-semibold text-primary text-xs hover:underline"
            href={file.fileUrl}
            rel="noreferrer"
            target="_blank"
          >
            View file
            <HugeiconsIcon icon={ArrowRight01Icon} size={10} />
          </a>
        )}
      </div>
    </div>
  );
}

function PortalActivityPage() {
  const activityQuery = usePortalActivityData();
  const items = activityQuery.data ?? [];

  const typeFilter: Record<string, number> = {
    all: items.length,
    comment: items.filter((i) => i.type === "comment").length,
    update: items.filter((i) => i.type === "update").length,
    file: items.filter((i) => i.type === "file").length,
  };

  return (
    <PortalShell>
      <PageHeader
        description="A unified feed of all updates, notes, and file activity across your projects."
        title="Activity"
      />

      {activityQuery.isLoading && (
        <LoadingPanel
          description="Fetching your project activity…"
          title="Loading activity"
        />
      )}
      {!activityQuery.isLoading && activityQuery.error && (
        <ErrorPanel description={activityQuery.error} />
      )}
      {!(activityQuery.isLoading || activityQuery.error) &&
        items.length === 0 && (
          <EmptyPanel
            description="Updates, notes, and files shared on your projects will appear here."
            title="No activity yet"
          />
        )}

      {items.length > 0 && (
        <div className="space-y-5">
          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "update", label: "Updates" },
              { key: "comment", label: "Notes" },
              { key: "file", label: "Files" },
            ].map(({ key, label }) => (
              <Badge className="gap-1.5 text-xs" key={key} variant="outline">
                {label}
                <span className="rounded bg-secondary px-1 py-0.5 font-bold text-[9px]">
                  {typeFilter[key]}
                </span>
              </Badge>
            ))}
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <ActivityCard
                item={item}
                key={`${item.type}-${(item.data as { id: string }).id}-${i}`}
              />
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
