import { prisma } from "@/lib/prisma";

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

  return collections.map((col) => {
    const typeCounts = new Map<
      string,
      { icon: string; color: string; name: string; count: number }
    >();

    for (const ic of col.items) {
      const t = ic.item.itemType;
      const existing = typeCounts.get(t.id);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(t.id, { icon: t.icon, color: t.color, name: t.name, count: 1 });
      }
    }

    const types = [...typeCounts.values()].sort((a, b) => b.count - a.count);

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
      types,
    };
  });
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
