import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { createCollection } from "./collections";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
}));

import { auth } from "@/auth";
import { createCollection as dbCreateCollection } from "@/lib/db/collections";

type TestSession = { user?: { id?: string } } | null;

const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockDbCreate = vi.mocked(dbCreateCollection);

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
});
