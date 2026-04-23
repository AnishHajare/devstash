import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, count, updateMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany,
      count,
      updateMany,
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteFromR2: vi.fn(),
}));

import {
  getFavoriteItems,
  getPaginatedItemsByType,
  getSearchableItems,
  toggleItemPin,
  toggleItemFavorite,
} from "@/lib/db/items";

describe("items db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSearchableItems", () => {
    it("returns lightweight search records scoped to the user", async () => {
      findMany.mockResolvedValue([
        {
          id: "item-1",
          title: "React suspense snippet",
          description: "Streaming boundaries",
          content: "const value = use(resource)",
          url: null,
          fileName: null,
          itemType: {
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
          },
        },
      ]);

      const result = await getSearchableItems("user-1");

      expect(findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { updatedAt: "desc" },
        select: expect.objectContaining({
          id: true,
          title: true,
          description: true,
          itemType: {
            select: {
              name: true,
              icon: true,
              color: true,
            },
          },
        }),
      });
      expect(result).toEqual([
        {
          id: "item-1",
          title: "React suspense snippet",
          type: {
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
          },
          preview: "Streaming boundaries",
        },
      ]);
    });

    it("falls back to content, URL, then file name for preview text", async () => {
      findMany.mockResolvedValue([
        {
          id: "item-1",
          title: "Command",
          description: null,
          content: "npm test",
          url: null,
          fileName: null,
          itemType: { name: "Command", icon: "Terminal", color: "#f97316" },
        },
        {
          id: "item-2",
          title: "Docs",
          description: null,
          content: null,
          url: "https://example.com/docs",
          fileName: null,
          itemType: { name: "Link", icon: "Link", color: "#22c55e" },
        },
        {
          id: "item-3",
          title: "Spec",
          description: null,
          content: null,
          url: null,
          fileName: "global-search.pdf",
          itemType: { name: "File", icon: "File", color: "#64748b" },
        },
      ]);

      const result = await getSearchableItems("user-1");

      expect(result.map((item) => item.preview)).toEqual([
        "npm test",
        "https://example.com/docs",
        "global-search.pdf",
      ]);
    });
  });

  describe("getFavoriteItems", () => {
    it("fetches only favorite items sorted by updated date", async () => {
      findMany.mockResolvedValue([
        {
          id: "item-1",
          title: "React suspense snippet",
          description: "Streaming boundaries",
          contentType: "text",
          content: "const value = use(resource)",
          url: null,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          language: "TypeScript",
          isFavorite: true,
          isPinned: false,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          tags: [{ id: "tag-1", name: "react" }],
          itemType: {
            id: "type-snippet",
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
          },
        },
      ]);

      const result = await getFavoriteItems("user-1");

      expect(findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isFavorite: true },
        orderBy: { updatedAt: "desc" },
        include: {
          itemType: { select: { id: true, name: true, icon: true, color: true } },
          tags: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual([
        {
          id: "item-1",
          title: "React suspense snippet",
          description: "Streaming boundaries",
          contentType: "text",
          content: "const value = use(resource)",
          url: null,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          language: "TypeScript",
          isFavorite: true,
          isPinned: false,
          createdAt: "2026-04-21T10:00:00.000Z",
          updatedAt: "2026-04-22T10:00:00.000Z",
          tags: [{ id: "tag-1", name: "react" }],
          itemType: {
            id: "type-snippet",
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
          },
        },
      ]);
    });

    it("returns an empty array when the user has no favorite items", async () => {
      findMany.mockResolvedValue([]);

      const result = await getFavoriteItems("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("toggleItemPin", () => {
    it("calls updateMany with isPinned and returns true when a row is updated", async () => {
      updateMany.mockResolvedValue({ count: 1 });

      const result = await toggleItemPin("item-1", "user-1", true);

      expect(updateMany).toHaveBeenCalledWith({
        where: { id: "item-1", userId: "user-1" },
        data: { isPinned: true },
      });
      expect(result).toBe(true);
    });

    it("returns false when item does not exist or is not owned by user", async () => {
      updateMany.mockResolvedValue({ count: 0 });

      const result = await toggleItemPin("missing", "user-1", true);

      expect(result).toBe(false);
    });

    it("passes isPinned false to unpin an item", async () => {
      updateMany.mockResolvedValue({ count: 1 });

      await toggleItemPin("item-1", "user-1", false);

      expect(updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isPinned: false } })
      );
    });
  });

  describe("toggleItemFavorite", () => {
    it("calls updateMany with isFavorite and returns true when a row is updated", async () => {
      updateMany.mockResolvedValue({ count: 1 });

      const result = await toggleItemFavorite("item-1", "user-1", true);

      expect(updateMany).toHaveBeenCalledWith({
        where: { id: "item-1", userId: "user-1" },
        data: { isFavorite: true },
      });
      expect(result).toBe(true);
    });

    it("returns false when item does not exist or is not owned by user", async () => {
      updateMany.mockResolvedValue({ count: 0 });

      const result = await toggleItemFavorite("missing", "user-1", false);

      expect(result).toBe(false);
    });

    it("passes isFavorite false to unfavorite an item", async () => {
      updateMany.mockResolvedValue({ count: 1 });

      await toggleItemFavorite("item-1", "user-1", false);

      expect(updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isFavorite: false } })
      );
    });
  });

  describe("getPaginatedItemsByType", () => {
    it("fetches one typed page with skip/take and a matching count query", async () => {
      findMany.mockResolvedValue([
        {
          id: "item-1",
          title: "React suspense snippet",
          description: "Streaming boundaries",
          contentType: "text",
          content: "const value = use(resource)",
          url: null,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          language: "TypeScript",
          isFavorite: false,
          isPinned: false,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          tags: [{ id: "tag-1", name: "react" }],
          itemType: {
            id: "type-snippet",
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
          },
        },
      ]);
      count.mockResolvedValue(22);

      const result = await getPaginatedItemsByType("user-1", "Snippet", {
        skip: 21,
        take: 21,
      });

      const where = {
        userId: "user-1",
        itemType: { name: { equals: "Snippet", mode: "insensitive" } },
      };

      expect(findMany).toHaveBeenCalledWith({
        where,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip: 21,
        take: 21,
        include: {
          itemType: { select: { id: true, name: true, icon: true, color: true } },
          tags: { select: { id: true, name: true } },
        },
      });
      expect(count).toHaveBeenCalledWith({ where });
      expect(result).toEqual({
        totalCount: 22,
        items: [
          {
            id: "item-1",
            title: "React suspense snippet",
            description: "Streaming boundaries",
            contentType: "text",
            content: "const value = use(resource)",
            url: null,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            language: "TypeScript",
            isFavorite: false,
            isPinned: false,
            createdAt: "2026-04-21T10:00:00.000Z",
            updatedAt: "2026-04-22T10:00:00.000Z",
            tags: [{ id: "tag-1", name: "react" }],
            itemType: {
              id: "type-snippet",
              name: "Snippet",
              icon: "Code",
              color: "#3b82f6",
            },
          },
        ],
      });
    });
  });
});
