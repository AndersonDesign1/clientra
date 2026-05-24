"use client";

import {
  Delete02Icon,
  Download01Icon,
  FileChartColumnIcon,
  FileEmpty01Icon,
  FileImageIcon,
  Pdf01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
} from "@/components/common/state-panel";
import { Button } from "@/components/ui/button";
import {
  type ProjectFile,
  projectFilesQueryOptions,
  useDeleteProjectFileMutation,
  useProjectFilesData,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/uploadthing/client";

const fileInputAccept = "image/*,.pdf,.txt,.csv";
const maxFilesPerUpload = 6;
const maxUploadBytes = 32 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isProjectFile(value: unknown): value is ProjectFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.projectId === "string" &&
    typeof candidate.fileName === "string" &&
    typeof candidate.fileUrl === "string" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.uploadedBy === "string" &&
    typeof candidate.uploaderName === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.fileSize === "number"
  );
}

function resetFileInput(input: HTMLInputElement | null) {
  if (input) {
    input.value = "";
  }
}

function getUploadValidationError(files: File[]) {
  if (files.length > maxFilesPerUpload) {
    return `You can upload up to ${maxFilesPerUpload} files at a time.`;
  }

  const oversizedFile = files.find((file) => file.size > maxUploadBytes);

  if (oversizedFile) {
    return `${oversizedFile.name} is larger than the 32MB upload limit.`;
  }

  return null;
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
    mime.includes("excel") ||
    name.endsWith(".csv") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
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
    mime.includes("excel") ||
    name.endsWith(".csv") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900";
  }
  return "text-teal-600 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900";
}

interface ProjectFilesPanelProps {
  canDelete: boolean;
  projectId: string;
}

export function ProjectFilesPanel({
  canDelete,
  projectId,
}: ProjectFilesPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const filesQuery = useProjectFilesData(projectId);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteProjectFileMutation = useDeleteProjectFileMutation();

  const { isUploading, startUpload } = useUploadThing("projectFiles", {
    onClientUploadComplete: (uploadedFiles) => {
      setMutationError(null);
      const uploadedRecords: ProjectFile[] = [];

      for (const entry of uploadedFiles) {
        if (isProjectFile(entry.serverData)) {
          uploadedRecords.push(entry.serverData);
        }
      }

      queryClient.setQueryData<ProjectFile[]>(
        projectFilesQueryOptions(projectId).queryKey,
        (current) => [...uploadedRecords, ...(current ?? [])]
      );
    },
    onUploadError: (error) => {
      setMutationError(error.message);
    },
  });

  async function handleFileSelection(fileList: FileList | null) {
    const nextFiles = fileList ? Array.from(fileList) : [];

    if (nextFiles.length === 0) {
      return;
    }

    const validationError = getUploadValidationError(nextFiles);

    if (validationError) {
      setMutationError(validationError);
      resetFileInput(inputRef.current);
      return;
    }

    setMutationError(null);

    try {
      await startUpload(nextFiles, { projectId });
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to upload those files."
      );
    } finally {
      resetFileInput(inputRef.current);
    }
  }

  async function handleDelete(file: ProjectFile) {
    setMutationError(null);
    setPendingDeleteId(file.id);

    try {
      await deleteProjectFileMutation.mutateAsync({
        fileId: file.id,
        projectId,
      });
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to delete that file."
      );
    } finally {
      setPendingDeleteId(null);
    }
  }

  const visibleFiles = filesQuery.data ?? [];
  const hasBlockingState =
    (filesQuery.isLoading && visibleFiles.length === 0) ||
    Boolean(filesQuery.error && visibleFiles.length === 0);

  return (
    <section className="space-y-5 rounded-xl border border-border/40 bg-card p-6 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      {/* Panel Header */}
      <div className="flex flex-col gap-4 border-border/40 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="animate-slide-up-fade font-semibold text-base text-foreground">
            Project Files
          </h2>
          <p className="mt-1 animate-slide-up-fade text-muted-foreground text-xs leading-relaxed">
            Share and retrieve assets, templates, or documents securely.
          </p>
        </div>
      </div>

      <input
        accept={fileInputAccept}
        className="hidden"
        multiple
        onChange={(event) => {
          handleFileSelection(event.target.files).catch(() => undefined);
        }}
        ref={inputRef}
        type="file"
      />

      {/* Dashed Premium Dropzone Upload Area */}
      <button
        className={cn(
          "group relative flex w-full animate-slide-up-fade flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isUploading
            ? "animate-pulse border-primary bg-primary/5"
            : "cursor-pointer border-border/80 bg-secondary/15 hover:border-primary/40 hover:bg-secondary/35"
        )}
        disabled={isUploading}
        onClick={() => {
          if (!isUploading) {
            inputRef.current?.click();
          }
        }}
        type="button"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <HugeiconsIcon icon={Upload01Icon} size={15} />
        </div>
        <p className="mt-2 font-semibold text-foreground text-xs">
          {isUploading
            ? "Uploading files to server..."
            : "Drag & drop or click here to upload"}
        </p>
        <p className="mt-0.5 max-w-sm text-[10px] text-muted-foreground leading-relaxed">
          Images, PDFs, CSVs, or text files up to 32MB. Max 6 files at once.
        </p>
      </button>

      {mutationError ? (
        <div className="animate-slide-up-fade rounded-lg border border-rose-200/50 bg-rose-50/10 p-2.5 text-rose-700 text-xs">
          {mutationError}
        </div>
      ) : null}

      {/* Loading & Error States */}
      {filesQuery.isLoading && visibleFiles.length === 0 ? (
        <div className="py-4">
          <LoadingPanel />
        </div>
      ) : null}
      {!filesQuery.isLoading &&
      filesQuery.error &&
      visibleFiles.length === 0 ? (
        <div className="py-4">
          <ErrorPanel description={filesQuery.error} />
        </div>
      ) : null}

      {/* Empty State */}
      {!hasBlockingState && visibleFiles.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-secondary/5 py-4">
          <EmptyPanel
            description="All shared files on this project will be listed here."
            title="No files yet"
          />
        </div>
      ) : null}

      {/* Shared Files Table Register */}
      {visibleFiles.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-border/40 border-b bg-secondary/10 font-semibold text-[9px] text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2.5">File Name</th>
                <th className="px-4 py-2.5">Size</th>
                <th className="px-4 py-2.5">Uploaded By</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/15">
              {visibleFiles.map((file) => {
                const IconComponent = getFileIcon(file.mimeType, file.fileName);
                const colorStyles = getFileIconColor(
                  file.mimeType,
                  file.fileName
                );

                return (
                  <tr
                    className="group transition-colors duration-150 hover:bg-secondary/10"
                    key={file.id}
                  >
                    <td className="px-4 py-2 font-semibold text-foreground">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded border text-sm",
                            colorStyles
                          )}
                        >
                          <HugeiconsIcon icon={IconComponent} size={13} />
                        </div>
                        <span className="max-w-[200px] truncate font-bold text-[#08361f] text-xs sm:max-w-[320px] dark:text-foreground">
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
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          className="inline-flex h-7 items-center justify-center gap-1 rounded border border-border/60 bg-background px-2.5 font-bold text-[10px] text-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-secondary/40 active:scale-[0.98]"
                          href={file.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <HugeiconsIcon icon={Download01Icon} size={10} />
                          Download
                        </a>
                        {canDelete ? (
                          <Button
                            className="h-7 w-7 shrink-0 border border-border/40 bg-background p-0 text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                            disabled={pendingDeleteId === file.id}
                            onClick={() => {
                              handleDelete(file).catch(() => undefined);
                            }}
                            type="button"
                            variant="ghost"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={10} />
                            <span className="sr-only">
                              {pendingDeleteId === file.id
                                ? "Deleting"
                                : "Delete"}
                            </span>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
