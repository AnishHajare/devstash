"use client";

import type React from "react";
import {
  Download,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  File,
  Pin,
  Star,
} from "lucide-react";
import type { ItemWithType } from "@/lib/db/items";
import { formatBytes } from "@/lib/format-bytes";

type FileCategory = "image" | "video" | "audio" | "archive" | "code" | "text" | "default";

function getFileCategory(fileName: string | null): FileCategory {
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) return "audio";
  if (["zip", "tar", "gz", "bz2", "rar", "7z"].includes(ext)) return "archive";
  if (
    [
      "js", "ts", "jsx", "tsx", "py", "go", "rs", "rb", "java", "c", "cpp",
      "cs", "php", "sh", "bash", "zsh", "json", "yaml", "yml", "toml", "xml",
      "html", "css", "scss", "md", "mdx", "ini",
    ].includes(ext)
  )
    return "code";
  if (["txt", "csv", "log", "pdf", "doc", "docx"].includes(ext)) return "text";

  return "default";
}

const CATEGORY_ICON: Record<FileCategory, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  archive: FileArchive,
  code: FileCode,
  text: FileText,
  default: File,
};

const CATEGORY_COLOR: Record<FileCategory, string> = {
  image:   "#ec4899",
  video:   "#8b5cf6",
  audio:   "#10b981",
  archive: "#f97316",
  code:    "#3b82f6",
  text:    "#6b7280",
  default: "#6b7280",
};


function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FileListRow({
  item,
  onOpen,
}: {
  item: ItemWithType;
  onOpen?: (id: string) => void;
}) {
  const ext = item.fileName?.split(".").pop()?.toLowerCase() ?? "";
  const category = getFileCategory(item.fileName);
  const FileIcon = CATEGORY_ICON[category];
  const color = CATEGORY_COLOR[category];
  const downloadUrl = item.fileUrl ? `/api/download/${item.fileUrl}` : null;

  return (
    <div
      onClick={() => onOpen?.(item.id)}
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors duration-150 hover:border-border/60 hover:bg-muted"
    >
      {/* File icon with extension badge */}
      <div
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md"
        style={{ backgroundColor: `${color}18` }}
      >
        <FileIcon className="h-4 w-4" style={{ color }} />
        {ext && (
          <span
            className="text-[9px] font-bold uppercase leading-none tracking-wide"
            style={{ color }}
          >
            {ext.slice(0, 4)}
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {item.isPinned && (
            <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
          )}
        </div>
        {item.fileName && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.fileName}
          </p>
        )}
        {/* Mobile: secondary info stacked below name */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:hidden">
          <span>{formatBytes(item.fileSize)}</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {/* Desktop: size + date */}
      <div className="hidden shrink-0 items-center gap-6 text-xs text-muted-foreground sm:flex">
        <span className="w-16 text-right">{formatBytes(item.fileSize)}</span>
        <span className="w-24 text-right">{formatDate(item.createdAt)}</span>
      </div>

      {/* Download button */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
