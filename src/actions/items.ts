"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
} from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

const createItemSchema = z.object({
  typeId: z.string().min(1, "Type is required"),
  typeName: z.string().min(1),
  contentType: z.enum(["text", "url"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

const TEXT_CONTENT_TYPES = ["snippet", "prompt", "command", "note"];
const LANGUAGE_TYPES = ["snippet", "command"];

export async function createItem(formData: unknown): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createItemSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const { typeId, typeName, contentType, title, description, content, url, language, tags } =
    parsed.data;

  if (contentType === "text" && TEXT_CONTENT_TYPES.includes(typeName)) {
    if (!content?.trim()) {
      return { success: false, error: "Content is required" };
    }
  }

  if (contentType === "url") {
    if (!url?.trim()) {
      return { success: false, error: "URL is required" };
    }
    try {
      new URL(url);
    } catch {
      return { success: false, error: "Invalid URL" };
    }
  }

  try {
    const created = await dbCreateItem({
      title,
      description: description?.trim() || null,
      contentType,
      content: contentType === "text" ? (content ?? null) : null,
      url: contentType === "url" ? (url ?? null) : null,
      language: LANGUAGE_TYPES.includes(typeName) ? (language?.trim() || null) : null,
      tags,
      itemTypeId: typeId,
      userId: session.user.id,
    });

    return { success: true, data: created };
  } catch {
    return { success: false, error: "Failed to create item" };
  }
}

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().url("Invalid URL").nullable().optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export async function updateItem(
  itemId: string,
  formData: unknown
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateItemSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const { title, description, content, url, language, tags } = parsed.data;

  try {
    const updated = await dbUpdateItem(itemId, session.user.id, {
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ?? null,
      language: language ?? null,
      tags,
    });

    if (!updated) {
      return { success: false, error: "Item not found" };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to update item" };
  }
}

type DeleteItemResult = { success: true } | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const deleted = await dbDeleteItem(itemId, session.user.id);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete item" };
  }
}
