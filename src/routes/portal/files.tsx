import {
  Download01Icon,
  File01Icon,
  FileChartColumnIcon,
  FileEmpty01Icon,
  FileImageIcon,
  Pdf01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { requireClientSession } from "@/auth/guards";
import { PageHeader } from "@/components/common/product-ui";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";
import {
  ensurePortalFilesData,
  type PortalFileWithProject,
  type ProjectFile,
  portalFilesQueryOptions,
  usePortalFilesData,
  useProjectsData,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/uploadthing/client";

export const Route = createFileRoute("/portal/files")({
  beforeLoad: requireClientSession,
  loader: ({ context }) => ensurePortalFilesData(context.queryClient),
  component: PortalFilesPage,
});

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string, fileName: string) {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) {
    return FileImageIcon;
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return Pdf01Icon;
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("csv") ||
    name.endsWith(".csv")
  ) {
    return FileChartColumnIcon;
  }
  return FileEmpty01Icon;
}

function getFileIconColor(mimeType: string, fileName: string) {
  const name = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) {
    return "text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900";
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("csv") ||
    name.endsWith(".csv")
  ) {
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900";
  }
  return "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900";
}

function isProjectFile(value: unknown): value is ProjectFile {
  if (!value || typeof value !== "object") {
    return false;
  }
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.projectId === "string" &&
    typeof c.fileName === "string" &&
    typeof c.fileUrl === "string" &&
    typeof c.mimeType === "string" &&
    typeof c.uploadedBy === "string" &&
    typeof c.uploaderName === "string" &&
    typeof c.fileSize === "number" &&
    typeof c.createdAt === "string"
  );
}

function PortalFilesPage() {
  const filesQuery = usePortalFilesData();
  const projectsQuery = useProjectsData();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { isUploading, startUpload } = useUploadThing("projectFiles", {
    onClientUploadComplete: (uploaded) => {
      const newFiles: PortalFileWithProject[] = [];
      const invalidFiles: string[] = [];
      const projectMap = new Map(
        projectsQuery.data?.map((p) => [p.id, p]) ?? []
      );
      for (const entry of uploaded) {
        if (isProjectFile(entry.serverData)) {
          const project = projectMap.get(entry.serverData.projectId);
          newFiles.push({
            ...entry.serverData,
            projectTitle: project?.title ?? "Project",
          });
        } else {
          console.warn("Invalid project file uploaded:", entry);
          invalidFiles.push(entry.name || entry.key);
        }
      }
      if (invalidFiles.length > 0) {
        setUploadError(
          `Failed validation for files: ${invalidFiles.join(", ")}`
        );
      }
      queryClient.setQueryData<PortalFileWithProject[]>(
        portalFilesQueryOptions().queryKey,
        (current) => [...newFiles, ...(current ?? [])]
      );
      setShowUpload(false);
    },
    onUploadError: (err) => setUploadError(err.message),
  });

  async function handleFileSelect(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0 || !uploadProjectId) {
      return;
    }
    setUploadError(null);
    try {
      await startUpload(files, { projectId: uploadProjectId });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const files = filesQuery.data ?? [];

  // Group files by project
  const byProject = new Map<
    string,
    { title: string; files: PortalFileWithProject[] }
  >();
  for (const file of files) {
    if (!byProject.has(file.projectId)) {
      byProject.set(file.projectId, { title: file.projectTitle, files: [] });
    }
    const projectGroup = byProject.get(file.projectId);
    if (projectGroup) {
      projectGroup.files.push(file);
    }
  }

  const projects = projectsQuery.data ?? [];

  return (
    <PortalShell>
      <PageHeader
        actions={
          <button
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-primary px-3 py-1.5 font-semibold text-primary-foreground text-xs shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            onClick={() => setShowUpload((v) => !v)}
            type="button"
          >
            <HugeiconsIcon icon={Upload01Icon} size={13} />
            Upload File
          </button>
        }
        description="All shared files and assets across your projects."
        title="Files"
      />

      {/* Upload Panel */}
      {showUpload && (
        <div className="mb-6 animate-slide-up-fade rounded-xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
          <h3 className="mb-3 font-semibold text-foreground text-sm">
            Upload to a project
          </h3>
          <div className="flex flex-wrap gap-3">
            <select
              className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              onChange={(e) => setUploadProjectId(e.target.value)}
              value={uploadProjectId}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <input
              accept="image/*,.pdf,.txt,.csv"
              aria-label="Upload files"
              className="hidden"
              multiple
              onChange={(e) =>
                handleFileSelect(e.target.files).catch(() => undefined)
              }
              ref={inputRef}
              type="file"
            />
            <button
              className={cn(
                "rounded-lg border px-4 py-2 font-semibold text-sm transition-all",
                !uploadProjectId || isUploading
                  ? "cursor-not-allowed border-border/30 bg-secondary/30 text-muted-foreground"
                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              )}
              disabled={!uploadProjectId || isUploading}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              {isUploading ? "Uploading…" : "Choose Files"}
            </button>
          </div>
          {uploadError && (
            <p className="mt-2 text-rose-600 text-xs">{uploadError}</p>
          )}
        </div>
      )}

      {filesQuery.isLoading && (
        <LoadingPanel
          description="Fetching your shared files…"
          title="Loading files"
        />
      )}
      {!filesQuery.isLoading && filesQuery.error && (
        <ErrorPanel description={filesQuery.error} />
      )}
      {!(filesQuery.isLoading || filesQuery.error) && files.length === 0 && (
        <EmptyPanel
          description="Files shared on your projects will appear here."
          title="No files yet"
        />
      )}

      {files.length > 0 && (
        <div className="space-y-6">
          {Array.from(byProject.entries()).map(([projectId, group]) => (
            <section className="animate-slide-up-fade" key={projectId}>
              <div className="mb-2 flex items-center gap-2">
                <HugeiconsIcon
                  className="text-primary"
                  icon={File01Icon}
                  size={14}
                />
                <h2 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  {group.title}
                </h2>
                <Badge className="text-[10px]" variant="outline">
                  {group.files.length} files
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-border/40 border-b bg-secondary/10 font-semibold text-[9px] text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-2.5">File Name</th>
                      <th className="px-4 py-2.5">Size</th>
                      <th className="px-4 py-2.5">Uploaded by</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/15">
                    {group.files.map((file) => {
                      const Icon = getFileIcon(file.mimeType, file.fileName);
                      const color = getFileIconColor(
                        file.mimeType,
                        file.fileName
                      );
                      return (
                        <tr
                          className="group transition-colors duration-150 hover:bg-secondary/10"
                          key={file.id}
                        >
                          <td className="px-4 py-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded border",
                                  color
                                )}
                              >
                                <HugeiconsIcon icon={Icon} size={13} />
                              </div>
                              <span className="max-w-[200px] truncate font-bold text-[#08361f] text-xs sm:max-w-[280px] dark:text-foreground">
                                {file.fileName}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-semibold text-muted-foreground text-xs">
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-semibold text-muted-foreground text-xs">
                            {file.uploaderName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 font-semibold text-muted-foreground text-xs">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <a
                              className="inline-flex h-7 items-center justify-center gap-1 rounded border border-border/60 bg-background px-2.5 font-bold text-[10px] text-foreground transition-all duration-200 hover:bg-secondary/40"
                              href={file.fileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <HugeiconsIcon icon={Download01Icon} size={10} />
                              Download
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
