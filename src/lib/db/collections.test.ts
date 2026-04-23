import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  collectionFindMany,
  collectionFindFirst,
  collectionCount,
  update,
  deleteMany,
  itemCount,
  itemFindMany,
} = vi.hoisted(() => ({
  collectionFindMany: vi.fn(),
  collectionFindFirst: vi.fn(),
  collectionCount: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  itemCount: vi.fn(),
  itemFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany: collectionFindMany,
      findFirst: collectionFindFirst,
      count: collectionCount,
      update,
      deleteMany,
    },
    item: {
      count: itemCount,
      findMany: itemFindMany,
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  deleteFromR2: vi.fn(),
}));

import {
  getCollectionsForUser,
  getPaginatedCollectionsForUser,
  getFavoriteCollections,
  getCollectionWithItems,
  toggleFavoriteCollection,
  updateCollection,
  deleteCollection,
} from "@/lib/db/collections";

describe("collections db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCollectionsForUser", () => {
    it("derives item counts and type breakdown from collection items", async () => {
      collectionFindMany.mockResolvedValue([
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

      expect(collectionFindMany).toHaveBeenCalledWith(
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

  describe("getPaginatedCollectionsForUser", () => {
    it("fetches one collection page with skip/take and a matching count query", async () => {
      collectionFindMany.mockResolvedValue([
        {
          id: "col-1",
          name: "React Patterns",
          description: "Reusable examples",
          isFavorite: false,
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
          ],
        },
      ]);
      collectionCount.mockResolvedValue(22);

      const result = await getPaginatedCollectionsForUser("user-1", {
        skip: 21,
        take: 21,
      });

      expect(collectionFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { updatedAt: "desc" },
        skip: 21,
        take: 21,
        include: {
          items: {
            select: {
              item: {
                select: {
                  itemType: {
                    select: { id: true, icon: true, color: true, name: true },
                  },
                },
              },
            },
          },
        },
      });
      expect(collectionCount).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });
      expect(result).toEqual({
        totalCount: 22,
        collections: [
          {
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
          },
        ],
      });
    });
  });

  describe("getFavoriteCollections", () => {
    it("fetches only favorite collections sorted by updated date", async () => {
      collectionFindMany.mockResolvedValue([
        {
          id: "col-1",
          name: "Favorites",
          description: null,
          isFavorite: true,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          items: [],
        },
      ]);

      const result = await getFavoriteCollections("user-1");

      expect(collectionFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isFavorite: true },
        orderBy: { updatedAt: "desc" },
        include: {
          items: {
            select: {
              item: {
                select: {
                  itemType: {
                    select: { id: true, icon: true, color: true, name: true },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toEqual([
        {
          id: "col-1",
          name: "Favorites",
          description: null,
          isFavorite: true,
          itemCount: 0,
          createdAt: new Date("2026-04-21T10:00:00.000Z"),
          updatedAt: new Date("2026-04-22T10:00:00.000Z"),
          types: [],
        },
      ]);
    });

    it("returns an empty array when the user has no favorite collections", async () => {
      collectionFindMany.mockResolvedValue([]);

      const result = await getFavoriteCollections("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("getCollectionWithItems", () => {
    it("returns null when the collection does not exist for the user", async () => {
      collectionFindFirst.mockResolvedValue(null);
      itemCount.mockResolvedValue(0);
      itemFindMany.mockResolvedValue([]);

      await expect(getCollectionWithItems("user-1", "missing")).resolves.toBeNull();
      expect(collectionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "missing",
            userId: "user-1",
          },
        })
      );
    });

    it("returns collection metadata with a paginated serialized item page", async () => {
      collectionFindFirst.mockResolvedValue({
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
      itemCount.mockResolvedValue(22);
      itemFindMany.mockResolvedValue([
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

      const result = await getCollectionWithItems("user-1", "col-1", {
        skip: 21,
        take: 21,
      });

      const itemWhere = {
        userId: "user-1",
        collections: { some: { collectionId: "col-1" } },
      };

      expect(itemCount).toHaveBeenCalledWith({ where: itemWhere });
      expect(itemFindMany).toHaveBeenCalledWith({
        where: itemWhere,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip: 21,
        take: 21,
        include: {
          itemType: {
            select: { id: true, name: true, icon: true, color: true },
          },
          tags: {
            select: { id: true, name: true },
          },
        },
      });

      expect(result).toEqual({
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: false,
        itemCount: 22,
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

  describe("toggleFavoriteCollection", () => {
    it("returns null when the collection does not exist for the user", async () => {
      collectionFindFirst.mockResolvedValue(null);

      await expect(
        toggleFavoriteCollection("col-1", "user-1", true)
      ).resolves.toBeNull();

      expect(collectionFindFirst).toHaveBeenCalledWith({
        where: { id: "col-1", userId: "user-1" },
        include: {
          items: {
            select: {
              item: {
                select: {
                  itemType: {
                    select: { id: true, icon: true, color: true, name: true },
                  },
                },
              },
            },
          },
        },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it("updates the collection favorite state and returns collection metadata", async () => {
      const existingCollection = {
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: false,
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
        ],
      };

      collectionFindFirst.mockResolvedValue(existingCollection);
      update.mockResolvedValue({
        ...existingCollection,
        isFavorite: true,
      });

      const result = await toggleFavoriteCollection("col-1", "user-1", true);

      expect(update).toHaveBeenCalledWith({
        where: { id: "col-1" },
        data: { isFavorite: true },
        include: {
          items: {
            select: {
              item: {
                select: {
                  itemType: {
                    select: { id: true, icon: true, color: true, name: true },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toEqual({
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: true,
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
      });
    });

    it("removes the collection from favorites when toggled to false", async () => {
      const existingCollection = {
        id: "col-1",
        name: "React Patterns",
        description: null,
        isFavorite: true,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        items: [],
      };

      collectionFindFirst.mockResolvedValue(existingCollection);
      update.mockResolvedValue({ ...existingCollection, isFavorite: false });

      const result = await toggleFavoriteCollection("col-1", "user-1", false);

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isFavorite: false } })
      );
      expect(result).toMatchObject({ id: "col-1", isFavorite: false });
    });
  });

  describe("updateCollection", () => {
    it("returns null when the collection does not exist for the user", async () => {
      collectionFindFirst.mockResolvedValue(null);

      await expect(
        updateCollection("missing", "user-1", {
          name: "Updated",
          description: null,
        })
      ).resolves.toBeNull();
      expect(update).not.toHaveBeenCalled();
    });

    it("updates the collection and preserves derived metadata", async () => {
      collectionFindFirst.mockResolvedValue({
        id: "col-1",
        name: "React Patterns",
        description: "Reusable examples",
        isFavorite: false,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        items: [],
      });
      update.mockResolvedValue({
        id: "col-1",
        name: "Updated Collection",
        description: null,
        isFavorite: false,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T11:00:00.000Z"),
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
        ],
      });

      const result = await updateCollection("col-1", "user-1", {
        name: "Updated Collection",
        description: null,
      });

      expect(collectionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "col-1", userId: "user-1" },
        })
      );
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "col-1" },
          data: {
            name: "Updated Collection",
            description: null,
          },
        })
      );
      expect(result).toEqual({
        id: "col-1",
        name: "Updated Collection",
        description: null,
        isFavorite: false,
        itemCount: 1,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T11:00:00.000Z"),
        types: [
          {
            name: "Snippet",
            icon: "Code",
            color: "#3b82f6",
            count: 1,
          },
        ],
      });
    });
  });

  describe("deleteCollection", () => {
    it("returns true when a collection is deleted for the user", async () => {
      deleteMany.mockResolvedValue({ count: 1 });

      await expect(deleteCollection("col-1", "user-1")).resolves.toBe(true);
      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: "col-1", userId: "user-1" },
      });
    });

    it("returns false when the collection does not exist for the user", async () => {
      deleteMany.mockResolvedValue({ count: 0 });

      await expect(deleteCollection("missing", "user-1")).resolves.toBe(false);
    });
  });
});
