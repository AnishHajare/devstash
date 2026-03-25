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

/**
 * Fetch all collections for a user with item counts and type breakdown.
 */
export async function getCollectionsForUser(
  userId: string
): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    // Count items per type
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
        typeCounts.set(t.id, {
          icon: t.icon,
          color: t.color,
          name: t.name,
          count: 1,
        });
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
 * Get collection stats for a user.
 */
export async function getCollectionStats(userId: string) {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}
