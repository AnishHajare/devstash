import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  toggleFavoriteCollection,
} from "./collections";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  toggleFavoriteCollection: vi.fn(),
}));

vi.mock("@/lib/feature-gate", () => ({
  canCreateCollection: vi.fn(),
  FREE_LIMITS: { items: 50, collections: 5 },
}));

import { auth } from "@/auth";
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  toggleFavoriteCollection as dbToggleFavoriteCollection,
} from "@/lib/db/collections";
import { canCreateCollection } from "@/lib/feature-gate";

type TestSession = { user?: { id?: string; isPro?: boolean } } | null;

const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockDbCreate = vi.mocked(dbCreateCollection);
const mockDbUpdate = vi.mocked(dbUpdateCollection);
const mockDbDelete = vi.mocked(dbDeleteCollection);
const mockDbToggleFavorite = vi.mocked(dbToggleFavoriteCollection);
const mockCanCreateCollection = vi.mocked(canCreateCollection);

const mockSession = { user: { id: "user-1" } };

const mockCollection = {
  id: "col-1",
  name: "React Patterns",
  description: "Useful React hooks and patterns",
  isFavorite: false,
  itemCount: 0,
  createdAt: new Date("2026-04-21"),
  updatedAt: new Date("2026-04-21"),
  types: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCanCreateCollection.mockResolvedValue(true);
});

describe("createCollection", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createCollection({ name: "My Collection" });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDbCreate).not.toHaveBeenCalled();
  });

  it("returns validation error when name is missing", async () => {
    mockAuth.mockResolvedValue(mockSession);

    const result = await createCollection({ name: "" });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mockDbCreate).not.toHaveBeenCalled();
  });

  it("returns validation error when name is whitespace only", async () => {
    mockAuth.mockResolvedValue(mockSession);

    const result = await createCollection({ name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mockDbCreate).not.toHaveBeenCalled();
  });

  it("creates collection successfully with name only", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbCreate.mockResolvedValue({ ...mockCollection, description: null });

    const result = await createCollection({ name: "React Patterns" });

    expect(mockDbCreate).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: undefined,
    });
    expect(result).toEqual({
      success: true,
      data: { ...mockCollection, description: null },
    });
  });

  it("creates collection with optional description", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbCreate.mockResolvedValue(mockCollection);

    const result = await createCollection({
      name: "React Patterns",
      description: "Useful React hooks and patterns",
    });

    expect(mockDbCreate).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: "Useful React hooks and patterns",
    });
    expect(result).toEqual({ success: true, data: mockCollection });
  });

  it("returns error when DB throws", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbCreate.mockRejectedValue(new Error("DB connection failed"));

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({
      success: false,
      error: "Failed to create collection",
    });
  });

  it("returns upgrade error when a free user is at the collection limit", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockCanCreateCollection.mockResolvedValue(false);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to create more than 5 collections.",
    });
    expect(mockDbCreate).not.toHaveBeenCalled();
  });

  it("allows a Pro user to create collections past the free limit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockCanCreateCollection.mockResolvedValue(true);
    mockDbCreate.mockResolvedValue(mockCollection as never);

    const result = await createCollection({ name: "Fourth Collection" });

    expect(result.success).toBe(true);
    expect(mockDbCreate).toHaveBeenCalled();
  });
});

describe("updateCollection", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateCollection("col-1", { name: "Updated" });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("returns validation error when name is blank", async () => {
    mockAuth.mockResolvedValue(mockSession);

    const result = await updateCollection("col-1", { name: "   " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("updates a collection successfully", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbUpdate.mockResolvedValue({
      ...mockCollection,
      name: "Updated Collection",
      description: null,
    });

    const result = await updateCollection("col-1", {
      name: "Updated Collection",
      description: null,
    });

    expect(mockDbUpdate).toHaveBeenCalledWith("col-1", "user-1", {
      name: "Updated Collection",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        ...mockCollection,
        name: "Updated Collection",
        description: null,
      },
    });
  });

  it("returns not found when the collection is missing", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbUpdate.mockResolvedValue(null);

    const result = await updateCollection("missing", { name: "Updated" });

    expect(result).toEqual({
      success: false,
      error: "Collection not found",
    });
  });

  it("returns error when DB throws", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbUpdate.mockRejectedValue(new Error("DB failed"));

    const result = await updateCollection("col-1", { name: "Updated" });

    expect(result).toEqual({
      success: false,
      error: "Failed to update collection",
    });
  });
});

describe("deleteCollection", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteCollection("col-1");

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDbDelete).not.toHaveBeenCalled();
  });

  it("deletes a collection successfully", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbDelete.mockResolvedValue(true);

    const result = await deleteCollection("col-1");

    expect(mockDbDelete).toHaveBeenCalledWith("col-1", "user-1");
    expect(result).toEqual({ success: true });
  });

  it("returns not found when the collection does not exist", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbDelete.mockResolvedValue(false);

    const result = await deleteCollection("missing");

    expect(result).toEqual({
      success: false,
      error: "Collection not found",
    });
  });

  it("returns error when DB throws", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbDelete.mockRejectedValue(new Error("DB failed"));

    const result = await deleteCollection("col-1");

    expect(result).toEqual({
      success: false,
      error: "Failed to delete collection",
    });
  });
});

describe("toggleFavoriteCollection", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleFavoriteCollection("col-1", true);

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDbToggleFavorite).not.toHaveBeenCalled();
  });

  it("updates the collection favorite state successfully", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbToggleFavorite.mockResolvedValue({
      ...mockCollection,
      isFavorite: true,
    });

    const result = await toggleFavoriteCollection("col-1", true);

    expect(mockDbToggleFavorite).toHaveBeenCalledWith("col-1", "user-1", true);
    expect(result).toEqual({
      success: true,
      data: {
        ...mockCollection,
        isFavorite: true,
      },
    });
  });

  it("returns not found when the collection does not exist", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbToggleFavorite.mockResolvedValue(null);

    const result = await toggleFavoriteCollection("missing", false);

    expect(result).toEqual({
      success: false,
      error: "Collection not found",
    });
  });

  it("removes the collection from favorites when called with false", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbToggleFavorite.mockResolvedValue({
      ...mockCollection,
      isFavorite: false,
    });

    const result = await toggleFavoriteCollection("col-1", false);

    expect(mockDbToggleFavorite).toHaveBeenCalledWith("col-1", "user-1", false);
    expect(result).toEqual({
      success: true,
      data: {
        ...mockCollection,
        isFavorite: false,
      },
    });
  });

  it("returns error when DB throws", async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockDbToggleFavorite.mockRejectedValue(new Error("DB failed"));

    const result = await toggleFavoriteCollection("col-1", false);

    expect(result).toEqual({
      success: false,
      error: "Failed to update collection favorite",
    });
  });
});
