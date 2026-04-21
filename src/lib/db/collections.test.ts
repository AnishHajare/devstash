import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findFirst } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany,
      findFirst,
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteFromR2: vi.fn(),
}));

import {
  getCollectionsForUser,
  getCollectionWithItems,
} from "@/lib/db/collections";

describe("collections db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCollectionsForUser", () => {
    it("derives item counts and type breakdown from collection items", async () => {
      findMany.mockResolvedValue([
        {
          id: "col-1",
          name: "React Patterns",
          description: "Reusable examples",
          isFavorite: true,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          items: [
            {
              item: {
                itemType: {
                  id: "type-snippet",
                  name: "Snippet",
                  icon: "Code",
                  color: "#3b82f6",
                },
              },
            },
            {
              item: {
                itemType: {
                  id: "type-snippet",
                  name: "Snippet",
                  icon: "Code",
                  color: "#3b82f6",
                },
              },
            },
            {
              item: {
                itemType: {
                  id: "type-link",
                  name: "Link",
                  icon: "Link",
                  color: "#22c55e",
                },
              },
            },
          ],
        },
      ]);

      const result = await getCollectionsForUser("user-1");

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          orderBy: { updatedAt: "desc" },
        })
      );
      expect(result).toEqual([
        {
          id: "col-1",
          name: "React Patterns",
          description: "Reusable examples",
          isFavorite: true,
          itemCount: 3,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          types: [
            {
              name: "Snippet",
              icon: "Code",
              color: "#3b82f6",
              count: 2,
            },
            {
              name: "Link",
              icon: "Link",
              color: "#22c55e",
              count: 1,
            },
          ],
        },
      ]);
    });
  });

  describe("getCollectionWithItems", () => {
    it("returns null when the collection does not exist for the user", async () => {
      findFirst.mockResolvedValue(null);

      await expect(getCollectionWithItems("user-1", "missing")).resolves.toBeNull();
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "missing",
            userId: "user-1",
          },
        })
      );
    });

    it("returns collection metadata with serialized items", async () => {
      findFirst.mockResolvedValue({
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: false,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        items: [
          {
            item: {
              id: "item-1",
              title: "useEffectEvent pattern",
              description: "React example",
              contentType: "text",
              content: "const onSave = useEffectEvent(() => {})",
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
          },
        ],
      });

      const result = await getCollectionWithItems("user-1", "col-1");

      expect(result).toEqual({
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: false,
        itemCount: 1,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        types: [
          {
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
            count: 1,
          },
        ],
        items: [
          {
            id: "item-1",
            title: "useEffectEvent pattern",
            description: "React example",
            contentType: "text",
            content: "const onSave = useEffectEvent(() => {})",
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
        ],
      });
    });
  });
});
