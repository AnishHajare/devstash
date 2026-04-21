"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createCollection as dbCreateCollection } from "@/lib/db/collections";
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
