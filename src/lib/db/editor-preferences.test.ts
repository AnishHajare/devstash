import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUniqueOrThrow, userUpdate } = vi.hoisted(() => ({
  userFindUniqueOrThrow: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: userFindUniqueOrThrow,
      update: userUpdate,
    },
  },
}));

import {
  getEditorPreferences,
  updateEditorPreferences,
} from "@/lib/db/editor-preferences";

describe("editor preferences db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes missing saved preferences when reading", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ editorPreferences: null });

    await expect(getEditorPreferences("user-1")).resolves.toEqual({
      fontSize: 12,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark",
    });

    expect(userFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("writes the provided preferences and returns normalized saved data", async () => {
    userUpdate.mockResolvedValue({
      editorPreferences: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "monokai",
      },
    });

    await expect(
      updateEditorPreferences("user-1", {
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "monokai",
      })
    ).resolves.toEqual({
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        editorPreferences: {
          fontSize: 16,
          tabSize: 4,
          wordWrap: false,
          minimap: true,
          theme: "monokai",
        },
      },
      select: { editorPreferences: true },
    });
  });
});
