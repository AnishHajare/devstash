import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db/editor-preferences", () => ({
  updateEditorPreferences: vi.fn(),
}));

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { updateEditorPreferences as dbUpdateEditorPreferences } from "@/lib/db/editor-preferences";

type TestSession = { user?: { id?: string } } | null;

const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockDbUpdateEditorPreferences = vi.mocked(dbUpdateEditorPreferences);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe("updateEditorPreferences action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an auth error when the user is not signed in", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(
      updateEditorPreferences({
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      })
    ).resolves.toEqual({
      success: false,
      error: "Not authenticated",
    });

    expect(mockDbUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("validates allowed values", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    await expect(
      updateEditorPreferences({
        fontSize: 13,
        tabSize: 3,
        wordWrap: true,
        minimap: false,
        theme: "dracula",
      })
    ).resolves.toEqual({
      success: false,
      error: "Invalid font size",
    });

    expect(mockDbUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("persists valid preferences and revalidates settings", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDbUpdateEditorPreferences.mockResolvedValue({
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark",
    });

    await expect(
      updateEditorPreferences({
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "github-dark",
      })
    ).resolves.toEqual({
      success: true,
      data: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "github-dark",
      },
    });

    expect(mockDbUpdateEditorPreferences).toHaveBeenCalledWith("user-1", {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("returns a save error when the db layer throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDbUpdateEditorPreferences.mockRejectedValue(new Error("db down"));

    await expect(
      updateEditorPreferences({
        fontSize: 12,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      })
    ).resolves.toEqual({
      success: false,
      error: "Failed to save editor preferences",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
