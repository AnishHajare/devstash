import type { ItemWithType } from "@/lib/db/items";
import { serializeItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

export type CollectionOption = {
  id: string;
  name: string;
};

export type CollectionWithMeta = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** Item types present in this collection, sorted by count descending */
  types: { icon: string; color: string; name: string; count: number }[];
};

export type CollectionStats = {
  totalCollections: number;
  favoriteCollections: number;
};

export type CollectionDetail = CollectionWithMeta & {
  items: ItemWithType[];
};

export type UpdateCollectionInput = {
  name: string;
  description: string | null;
};

type CollectionMetaSource = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: {
    item: {
      itemType: { id: string; icon: string; color: string; name: string };
    };
  }[];
};

function toCollectionMeta(collection: CollectionMetaSource): CollectionWithMeta {
  const typeCounts = new Map<
    string,
    { icon: string; color: string; name: string; count: number }
  >();

  for (const { item } of collection.items) {
    const existing = typeCounts.get(item.itemType.id);
    if (existing) {
      existing.count++;
    } else {
      typeCounts.set(item.itemType.id, {
        icon: item.itemType.icon,
        color: item.itemType.color,
        name: item.itemType.name,
        count: 1,
      });
    }
  }

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: collection.items.length,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    types: [...typeCounts.values()].sort((a, b) => b.count - a.count),
  };
}

/**
 * Fetch all collections for a user with item counts and type breakdown.
 * Only selects the itemType fields needed — no full Item rows fetched.
 */
export async function getCollectionsForUser(
  userId: string
): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true, name: true } },
            },
          },
        },
      },
    },
  });

  return collections.map(toCollectionMeta);
}

/**
 * Fetch a single collection with all items for a user.
 */
export async function getCollectionWithItems(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    include: {
      items: {
        orderBy: {
          item: {
            updatedAt: "desc",
          },
        },
        select: {
          item: {
            include: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
              tags: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return null;
  }

  return {
    ...toCollectionMeta(collection),
    items: collection.items.map(({ item }) => serializeItem(item)),
  };
}

/**
 * Fetch lightweight collection options for selection UIs.
 */
export async function getCollectionOptionsForUser(
  userId: string
): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}

/**
 * Create a new collection for a user.
 */
export async function createCollection(
  userId: string,
  data: { name: string; description?: string }
): Promise<CollectionWithMeta> {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      userId,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: 0,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    types: [],
  };
}

/**
 * Update a collection by id, scoped to the owning user.
 */
export async function updateCollection(
  id: string,
  userId: string,
  data: UpdateCollectionInput
): Promise<CollectionWithMeta | null> {
  const existingCollection = await prisma.collection.findFirst({
    where: { id, userId },
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!existingCollection) {
    return null;
  }

  const updatedCollection = await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true, name: true } },
            },
          },
        },
      },
    },
  });

  return toCollectionMeta(updatedCollection);
}

/**
 * Delete a collection by id, scoped to the owning user.
 * Item rows remain intact; only the collection and join rows are removed.
 */
export async function deleteCollection(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.collection.deleteMany({
    where: { id, userId },
  });

  return result.count > 0;
}

/**
 * Derive collection stats from an already-fetched collections array.
 * Call this after getCollectionsForUser — avoids a second DB round-trip.
 */
export function deriveCollectionStats(
  collections: CollectionWithMeta[]
): CollectionStats {
  return {
    totalCollections: collections.length,
    favoriteCollections: collections.filter((c) => c.isFavorite).length,
  };
}
