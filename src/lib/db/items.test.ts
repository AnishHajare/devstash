import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany,
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteFromR2: vi.fn(),
}));

import { getSearchableItems } from "@/lib/db/items";

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
});
