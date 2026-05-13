"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import { parseOrError } from "@/lib/zod-helpers";
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  toggleItemPin as dbToggleItemPin,
  toggleItemFavorite as dbToggleItemFavorite,
} from "@/lib/db/items";
import { canCreateItem, canUseProType, FREE_LIMITS } from "@/lib/feature-gate";
import type { ItemDetail } from "@/lib/db/items";
import { TEXT_CONTENT_TYPES, LANGUAGE_TYPES, PRO_SYSTEM_TYPES } from "@/lib/item-type-constants";

const createItemSchema = z.object({
  typeId: z.string().min(1, "Type is required"),
  typeName: z.string().min(1),
  contentType: z.enum(["text", "url", "file"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string().trim().min(1)).default([]),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };


export async function createItem(formData: unknown): Promise<CreateItemResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = parseOrError(createItemSchema, formData);
  if (!parsed.success) return parsed;

  const { typeId, typeName, contentType, title, description, content, url, language, tags, collectionIds, fileKey, fileName, fileSize } =
    parsed.data;
  const { userId, isPro } = authResult;
  const isProType = PRO_SYSTEM_TYPES.some(
    (proType) => proType.toLowerCase() === typeName.toLowerCase()
  );

  if (isProType && !canUseProType(isPro)) {
    return {
      success: false,
      error: "Upgrade to Pro to save files and images.",
    };
  }

  const hasItemCapacity = await canCreateItem(userId, isPro);
  if (!hasItemCapacity) {
    return {
      success: false,
      error: `Upgrade to Pro to save more than ${FREE_LIMITS.items} items.`,
    };
  }

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

  if (contentType === "file") {
    if (!fileKey?.trim()) {
      return { success: false, error: "File upload is required" };
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
      fileUrl: contentType === "file" ? (fileKey ?? null) : null,
      fileName: contentType === "file" ? (fileName ?? null) : null,
      fileSize: contentType === "file" ? (fileSize ?? null) : null,
      tags,
      collectionIds,
      itemTypeId: typeId,
      userId,
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
  collectionIds: z.array(z.string().trim().min(1)).default([]),
});

type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export async function updateItem(
  itemId: string,
  formData: unknown
): Promise<UpdateItemResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = parseOrError(updateItemSchema, formData);
  if (!parsed.success) return parsed;

  const { title, description, content, url, language, tags, collectionIds } = parsed.data;

  try {
    const updated = await dbUpdateItem(itemId, authResult.userId, {
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ?? null,
      language: language ?? null,
      tags,
      collectionIds,
    });

    if (!updated) {
      return { success: false, error: "Item not found" };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to update item" };
  }
}

type ToggleItemPinResult = { success: true } | { success: false; error: string };

export async function toggleItemPin(
  itemId: string,
  isPinned: boolean
): Promise<ToggleItemPinResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const updated = await dbToggleItemPin(itemId, authResult.userId, isPinned);
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update item" };
  }
}

type ToggleItemFavoriteResult = { success: true } | { success: false; error: string };

export async function toggleItemFavorite(
  itemId: string,
  isFavorite: boolean
): Promise<ToggleItemFavoriteResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const updated = await dbToggleItemFavorite(itemId, authResult.userId, isFavorite);
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update item" };
  }
}

type DeleteItemResult = { success: true } | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const deleted = await dbDeleteItem(itemId, authResult.userId);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete item" };
  }
}
