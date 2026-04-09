import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateItem, deleteItem } from "./items";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

import { auth } from "@/auth";
import { updateItem as dbUpdateItem, deleteItem as dbDeleteItem } from "@/lib/db/items";

const mockAuth = vi.mocked(auth);
const mockDbUpdateItem = vi.mocked(dbUpdateItem);
const mockDbDeleteItem = vi.mocked(dbDeleteItem);

const validPayload = {
  title: "My Snippet",
  description: "A description",
  content: "console.log('hello')",
  url: null,
  language: "TypeScript",
  tags: ["react", "hooks"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Auth ─────────────────────────────────────────────────────

describe("updateItem action — auth", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateItem("item-1", validPayload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Not authenticated");
    expect(mockDbUpdateItem).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const result = await updateItem("item-1", validPayload);
    expect(result.success).toBe(false);
    expect(mockDbUpdateItem).not.toHaveBeenCalled();
  });
});

// ── Validation ───────────────────────────────────────────────

describe("updateItem action — Zod validation", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns error when title is empty", async () => {
    const result = await updateItem("item-1", { ...validPayload, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Title is required");
    expect(mockDbUpdateItem).not.toHaveBeenCalled();
  });

  it("returns error when title is whitespace only", async () => {
    const result = await updateItem("item-1", { ...validPayload, title: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Title is required");
  });

  it("returns error when url is not a valid URL", async () => {
    const result = await updateItem("item-1", {
      ...validPayload,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Invalid URL");
  });

  it("accepts null url without error", async () => {
    mockDbUpdateItem.mockResolvedValue({ id: "item-1" } as never);
    const result = await updateItem("item-1", { ...validPayload, url: null });
    expect(result.success).toBe(true);
  });

  it("accepts valid URL string", async () => {
    mockDbUpdateItem.mockResolvedValue({ id: "item-1" } as never);
    const result = await updateItem("item-1", {
      ...validPayload,
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("defaults tags to empty array when omitted", async () => {
    mockDbUpdateItem.mockResolvedValue({ id: "item-1" } as never);
    const { tags: _tags, ...payloadWithoutTags } = validPayload;
    const result = await updateItem("item-1", payloadWithoutTags);
    expect(result.success).toBe(true);
    expect(mockDbUpdateItem).toHaveBeenCalledWith(
      "item-1",
      "user-1",
      expect.objectContaining({ tags: [] })
    );
  });
});

// ── DB layer ─────────────────────────────────────────────────

describe("updateItem action — DB", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns error when item not found (db returns null)", async () => {
    mockDbUpdateItem.mockResolvedValue(null);
    const result = await updateItem("missing-id", validPayload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Item not found");
  });

  it("returns error when db throws", async () => {
    mockDbUpdateItem.mockRejectedValue(new Error("DB connection failed"));
    const result = await updateItem("item-1", validPayload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Failed to update item");
  });
});

// ── Happy path ───────────────────────────────────────────────

describe("updateItem action — success", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("calls db with correct arguments and returns updated item", async () => {
    const updatedItem = { id: "item-1", title: "My Snippet" };
    mockDbUpdateItem.mockResolvedValue(updatedItem as never);

    const result = await updateItem("item-1", validPayload);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(updatedItem);

    expect(mockDbUpdateItem).toHaveBeenCalledWith("item-1", "user-1", {
      title: "My Snippet",
      description: "A description",
      content: "console.log('hello')",
      url: null,
      language: "TypeScript",
      tags: ["react", "hooks"],
    });
  });

  it("trims whitespace from title", async () => {
    mockDbUpdateItem.mockResolvedValue({ id: "item-1" } as never);
    await updateItem("item-1", { ...validPayload, title: "  Trimmed  " });
    expect(mockDbUpdateItem).toHaveBeenCalledWith(
      "item-1",
      "user-1",
      expect.objectContaining({ title: "Trimmed" })
    );
  });

  it("passes null for optional fields when not provided", async () => {
    mockDbUpdateItem.mockResolvedValue({ id: "item-1" } as never);
    await updateItem("item-1", {
      title: "Minimal",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
    expect(mockDbUpdateItem).toHaveBeenCalledWith("item-1", "user-1", {
      title: "Minimal",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
  });
});

// ── deleteItem action ─────────────────────────────────────────

describe("deleteItem action — auth", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await deleteItem("item-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Not authenticated");
    expect(mockDbDeleteItem).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const result = await deleteItem("item-1");
    expect(result.success).toBe(false);
    expect(mockDbDeleteItem).not.toHaveBeenCalled();
  });
});

describe("deleteItem action — DB", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns error when item not found (db returns false)", async () => {
    mockDbDeleteItem.mockResolvedValue(false);
    const result = await deleteItem("missing-id");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Item not found");
  });

  it("returns error when db throws", async () => {
    mockDbDeleteItem.mockRejectedValue(new Error("DB error"));
    const result = await deleteItem("item-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Failed to delete item");
  });
});

describe("deleteItem action — success", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("calls db with item id and user id, returns success", async () => {
    mockDbDeleteItem.mockResolvedValue(true);
    const result = await deleteItem("item-1");
    expect(result.success).toBe(true);
    expect(mockDbDeleteItem).toHaveBeenCalledWith("item-1", "user-1");
  });
});
