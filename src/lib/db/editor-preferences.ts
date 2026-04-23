import { prisma } from "@/lib/prisma";
import {
  normalizeEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";

export async function getEditorPreferences(
  userId: string
): Promise<EditorPreferences> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(user.editorPreferences);
}

export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<EditorPreferences> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences },
    select: { editorPreferences: true },
  });

  return normalizeEditorPreferences(updatedUser.editorPreferences);
}
