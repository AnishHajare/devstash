"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";
import { parseOrError } from "@/lib/zod-helpers";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import {
  updateEditorPreferences as dbUpdateEditorPreferences,
} from "@/lib/db/editor-preferences";

type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

export async function updateEditorPreferences(
  formData: unknown
): Promise<UpdateEditorPreferencesResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = parseOrError(editorPreferencesSchema, formData);
  if (!parsed.success) return parsed;

  try {
    const updated = await dbUpdateEditorPreferences(authResult.userId, parsed.data);
    revalidatePath("/settings");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to save editor preferences" };
  }
}
