"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
} from "@/lib/db/collections";
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createCollectionSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const { name, description } = parsed.data;

  try {
    const created = await dbCreateCollection(session.user.id, {
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateCollectionSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  const { name, description } = parsed.data;

  try {
    const updated = await dbUpdateCollection(collectionId, session.user.id, {
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const deleted = await dbDeleteCollection(collectionId, session.user.id);
    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete collection" };
  }
}
