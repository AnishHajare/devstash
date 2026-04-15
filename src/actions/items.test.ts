import { describe, it, expect, vi, beforeEach } from "vitest";
import { createItem, updateItem, deleteItem } from "./items";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

import { auth } from "@/auth";
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
} from "@/lib/db/items";

const mockAuth = vi.mocked(auth);
const mockDbCreateItem = vi.mocked(dbCreateItem);
const mockDbUpdateItem = vi.mocked(dbUpdateItem);
const mockDbDeleteItem = vi.mocked(dbDeleteItem);

const validCreatePayload = {
  typeId: "type-1",
  typeName: "snippet",
  contentType: "text" as const,
  title: "My Snippet",
  description: "A description",
  content: "console.log('hello')",
  language: "TypeScript",
  tags: ["react", "hooks"],
};

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

// ── createItem — auth ────────────────────────────────────────

describe("createItem action — auth", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createItem(validCreatePayload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Not authenticated");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const result = await createItem(validCreatePayload);
    expect(result.success).toBe(false);
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });
});

// ── createItem — validation ──────────────────────────────────

describe("createItem action — validation", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns error when title is empty", async () => {
    const result = await createItem({ ...validCreatePayload, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Title is required");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when content is missing for snippet", async () => {
    const result = await createItem({ ...validCreatePayload, content: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Content is required");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when URL is missing for link type", async () => {
    const result = await createItem({
      ...validCreatePayload,
      typeName: "link",
      contentType: "url",
      content: undefined,
      url: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("URL is required");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when URL is invalid for link type", async () => {
    const result = await createItem({
      ...validCreatePayload,
      typeName: "link",
      contentType: "url",
      content: undefined,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Invalid URL");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when file upload is missing for file type", async () => {
    const result = await createItem({
      ...validCreatePayload,
      typeName: "file",
      contentType: "file",
      content: undefined,
      fileKey: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("File upload is required");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });

  it("returns error when file upload is missing for image type", async () => {
    const result = await createItem({
      ...validCreatePayload,
      typeName: "image",
      contentType: "file",
      content: undefined,
      fileKey: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("File upload is required");
    expect(mockDbCreateItem).not.toHaveBeenCalled();
  });
});

// ── createItem — DB ──────────────────────────────────────────

describe("createItem action — DB", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("returns error when db throws", async () => {
    mockDbCreateItem.mockRejectedValue(new Error("DB error"));
    const result = await createItem(validCreatePayload);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Failed to create item");
  });
});

// ── createItem — success ─────────────────────────────────────

describe("createItem action — success", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
  });

  it("calls db with correct arguments and returns created item", async () => {
    const createdItem = { id: "item-new", title: "My Snippet" };
    mockDbCreateItem.mockResolvedValue(createdItem as never);

    const result = await createItem(validCreatePayload);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(createdItem);

    expect(mockDbCreateItem).toHaveBeenCalledWith({
      title: "My Snippet",
      description: "A description",
      contentType: "text",
      content: "console.log('hello')",
      url: null,
      language: "TypeScript",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: ["react", "hooks"],
      itemTypeId: "type-1",
      userId: "user-1",
    });
  });

  it("creates link with URL and null content", async () => {
    mockDbCreateItem.mockResolvedValue({ id: "item-link" } as never);

    const result = await createItem({
      typeId: "type-link",
      typeName: "link",
      contentType: "url",
      title: "My Link",
      url: "https://example.com",
      tags: [],
    });

    expect(result.success).toBe(true);
    expect(mockDbCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "url",
        url: "https://example.com",
        content: null,
        language: null,
      })
    );
  });

  it("creates file item with fileUrl, fileName, fileSize and null content", async () => {
    mockDbCreateItem.mockResolvedValue({ id: "item-file" } as never);

    const result = await createItem({
      typeId: "type-file",
      typeName: "file",
      contentType: "file",
      title: "My PDF",
      fileKey: "user-1/uuid-report.pdf",
      fileName: "report.pdf",
      fileSize: 204800,
      tags: [],
    });

    expect(result.success).toBe(true);
    expect(mockDbCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "file",
        fileUrl: "user-1/uuid-report.pdf",
        fileName: "report.pdf",
        fileSize: 204800,
        content: null,
        url: null,
      })
    );
  });

  it("strips language for non-language types (prompt)", async () => {
    mockDbCreateItem.mockResolvedValue({ id: "item-prompt" } as never);

    await createItem({
      typeId: "type-prompt",
      typeName: "prompt",
      contentType: "text",
      title: "My Prompt",
      content: "You are a helpful assistant.",
      language: "english",
      tags: [],
    });

    expect(mockDbCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({ language: null })
    );
  });
});

// ── updateItem — auth ─────────────────────────────────────────

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
