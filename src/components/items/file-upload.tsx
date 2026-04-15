"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";

export type UploadedFile = {
  key: string;
  fileName: string;
  fileSize: number;
};

type Props = {
  itemType: "file" | "image";
  onUpload: (result: UploadedFile) => void;
  onClear: () => void;
  uploaded: UploadedFile | null;
  accentColor?: string;
};

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
const FILE_EXTS = [".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"];
const IMAGE_MAX_MB = 5;
const FILE_MAX_MB = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ itemType, onUpload, onClear, uploaded, accentColor = "#6b7280" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isImage = itemType === "image";
  const accept = isImage ? IMAGE_EXTS.join(",") : FILE_EXTS.join(",");
  const maxMb = isImage ? IMAGE_MAX_MB : FILE_MAX_MB;

  function handleFile(file: File) {
    setError(null);

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = isImage ? IMAGE_EXTS : FILE_EXTS;
    if (!allowed.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowed.join(", ")}`);
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File exceeds ${maxMb} MB limit`);
      return;
    }

    // Show image preview immediately
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    uploadFile(file);
  }

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("itemType", itemType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText) as UploadedFile;
        onUpload(data);
      } else {
        let msg = "Upload failed";
        try {
          msg = (JSON.parse(xhr.responseText) as { error: string }).error ?? msg;
        } catch {
          // use default
        }
        setError(msg);
        setPreview(null);
      }
    };

    xhr.onerror = () => {
      setProgress(null);
      setError("Upload failed");
      setPreview(null);
    };

    xhr.send(formData);
    setProgress(0);
  }

  function handleClear() {
    setPreview(null);
    setError(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  }

  // ── Uploaded state ──────────────────────────────────────────
  if (uploaded) {
    return (
      <div
        className="relative rounded-lg border overflow-hidden"
        style={{ borderColor: `${accentColor}40` }}
      >
        {isImage && preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={uploaded.fileName}
              className="w-full max-h-48 object-contain bg-black/20"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <FileText className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{uploaded.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(uploaded.fileSize)}</p>
            </div>
          </div>
        )}

        {/* File name + size footer for images */}
        {isImage && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-t border-border">
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground flex-1">{uploaded.fileName}</span>
            <span className="text-xs text-muted-foreground shrink-0">{formatBytes(uploaded.fileSize)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleClear}
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // ── Drop zone ───────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? accentColor : `${accentColor}40`,
          backgroundColor: dragging ? `${accentColor}08` : "transparent",
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {isImage ? (
            <ImageIcon className="h-5 w-5" style={{ color: accentColor }} />
          ) : (
            <Upload className="h-5 w-5" style={{ color: accentColor }} />
          )}
        </div>

        <div>
          <p className="text-sm font-medium">
            <span style={{ color: accentColor }}>Click to upload</span>{" "}
            <span className="text-muted-foreground">or drag and drop</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isImage ? `PNG, JPG, GIF, WebP, SVG up to ${IMAGE_MAX_MB} MB` : `PDF, TXT, JSON, YAML, XML and more up to ${FILE_MAX_MB} MB`}
          </p>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Uploading…</span>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
