import { prisma } from "@/lib/prisma";

export type ItemWithType = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
};

function serializeItem(item: {
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}): ItemWithType {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  } as ItemWithType;
}

/**
 * Fetch pinned items for a user.
 */
export async function getPinnedItems(
  userId: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  return items.map(serializeItem);
}

/**
 * Fetch recent items for a user.
 */
export async function getRecentItems(
  userId: string,
  limit = 10
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  return items.map(serializeItem);
}

/**
 * Get item stats for a user.
 */
export async function getItemStats(userId: string) {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}
