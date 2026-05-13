"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import { parseOrError } from "@/lib/zod-helpers";
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  toggleFavoriteCollection as dbToggleFavoriteCollection,
} from "@/lib/db/collections";
import { canCreateCollection, FREE_LIMITS } from "@/lib/feature-gate";
import type { CollectionWithMeta } from "@/lib/db/collections";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

type CreateCollectionResult =
  | { success: true; data: CollectionWithMeta }
  | { success: false; error: string };

export async function createCollection(
  formData: unknown
): Promise<CreateCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = parseOrError(createCollectionSchema, formData);
  if (!parsed.success) return parsed;

  const { name, description } = parsed.data;

  try {
    const hasCollectionCapacity = await canCreateCollection(
      authResult.userId,
      authResult.isPro
    );
    if (!hasCollectionCapacity) {
      return {
        success: false,
        error: `Upgrade to Pro to create more than ${FREE_LIMITS.collections} collections.`,
      };
    }

    const created = await dbCreateCollection(authResult.userId, {
      name,
      description: description || undefined,
    });
    return { success: true, data: created };
  } catch {
    return { success: false, error: "Failed to create collection" };
  }
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

type UpdateCollectionResult =
  | { success: true; data: CollectionWithMeta }
  | { success: false; error: string };

export async function updateCollection(
  collectionId: string,
  formData: unknown
): Promise<UpdateCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = parseOrError(updateCollectionSchema, formData);
  if (!parsed.success) return parsed;

  const { name, description } = parsed.data;

  try {
    const updated = await dbUpdateCollection(collectionId, authResult.userId, {
      name,
      description: description ?? null,
    });

    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to update collection" };
  }
}

type DeleteCollectionResult = { success: true } | { success: false; error: string };

export async function deleteCollection(
  collectionId: string
): Promise<DeleteCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const deleted = await dbDeleteCollection(collectionId, authResult.userId);
    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete collection" };
  }
}

type ToggleFavoriteCollectionResult =
  | { success: true; data: CollectionWithMeta }
  | { success: false; error: string };

export async function toggleFavoriteCollection(
  collectionId: string,
  isFavorite: boolean
): Promise<ToggleFavoriteCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  try {
    const updated = await dbToggleFavoriteCollection(
      collectionId,
      authResult.userId,
      isFavorite
    );

    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to update collection favorite" };
  }
}
