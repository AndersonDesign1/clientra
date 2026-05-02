"use client";

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
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-medium text-slate-900">Project files</h2>
          <p className="mt-1 text-slate-600 text-sm">
            Upload project documents, PDFs, text notes, and images up to 32MB,
            with up to 6 files per upload.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            accept={fileInputAccept}
            className="hidden"
            multiple
            onChange={(event) => {
              handleFileSelection(event.target.files);
            }}
            ref={inputRef}
            type="file"
          />
          <Button
            disabled={isUploading}
            onClick={() => {
              inputRef.current?.click();
            }}
            type="button"
          >
            {isUploading ? "Uploading..." : "Upload files"}
          </Button>
        </div>
      </div>

      {mutationError ? (
        <div className="mb-4 border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {mutationError}
        </div>
      ) : null}

      {filesQuery.isLoading && visibleFiles.length === 0 ? (
        <LoadingPanel />
      ) : null}
      {!filesQuery.isLoading &&
      filesQuery.error &&
      visibleFiles.length === 0 ? (
        <ErrorPanel description={filesQuery.error} />
      ) : null}
      {!hasBlockingState && visibleFiles.length === 0 ? (
        <EmptyPanel
          description="Files shared on this project will appear here once someone uploads them."
          title="No files yet"
        />
      ) : null}
      {visibleFiles.length > 0 ? (
        <div className="divide-y divide-slate-200 border-slate-200 border-y">
          {visibleFiles.map((file) => (
            <div
              className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
              key={file.id}
            >
              <div>
                <p className="font-medium text-slate-900">{file.fileName}</p>
                <p className="mt-1 text-slate-500 text-sm">
                  Uploaded by {file.uploaderName} ·{" "}
                  {new Date(file.createdAt).toLocaleString()} ·{" "}
                  {formatFileSize(file.fileSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs/relaxed hover:bg-input/50"
                  href={file.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download
                </a>
                {canDelete ? (
                  <Button
                    disabled={pendingDeleteId === file.id}
                    onClick={() => {
                      handleDelete(file);
                    }}
                    type="button"
                    variant="destructive"
                  >
                    {pendingDeleteId === file.id ? "Deleting..." : "Delete"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
