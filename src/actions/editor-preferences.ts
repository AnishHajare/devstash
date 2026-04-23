"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = editorPreferencesSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Validation failed" };
  }

  try {
    const updated = await dbUpdateEditorPreferences(session.user.id, parsed.data);
    revalidatePath("/settings");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to save editor preferences" };
  }
}
