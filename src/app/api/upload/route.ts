import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";

// Image constraints
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

// File constraints
const FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const FILE_EXTS = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
]);
const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const itemType = formData.get("itemType") as string | null; // "file" | "image"

  if (!file || !itemType) {
    return NextResponse.json({ error: "Missing file or itemType" }, { status: 400 });
  }

  if (itemType !== "file" && itemType !== "image") {
    return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
  }

  const ext = getExtension(file.name);
  const mime = file.type;
  const isImage = itemType === "image";

  // Validate extension and MIME type
  if (isImage) {
    if (!IMAGE_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Invalid image extension. Allowed: ${[...IMAGE_EXTS].join(", ")}` },
        { status: 400 }
      );
    }
    if (!IMAGE_MIME_TYPES.has(mime)) {
      return NextResponse.json({ error: "Invalid image MIME type" }, { status: 400 });
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 5 MB limit" },
        { status: 400 }
      );
    }
  } else {
    if (!FILE_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Invalid file extension. Allowed: ${[...FILE_EXTS].join(", ")}` },
        { status: 400 }
      );
    }
    if (!FILE_MIME_TYPES.has(mime)) {
      return NextResponse.json({ error: "Invalid file MIME type" }, { status: 400 });
    }
    if (file.size > FILE_MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 400 }
      );
    }
  }

  const safeFilename = sanitizeFilename(file.name);
  const key = `${session.user.id}/${randomUUID()}-${safeFilename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadToR2(key, buffer, mime);
  } catch (err) {
    console.error("R2 upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    key,
    fileName: file.name,
    fileSize: file.size,
    contentType: mime,
  });
}
