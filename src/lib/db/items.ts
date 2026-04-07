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

export type ItemTypeWithCount = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  count: number;
};

/**
 * Fetch all item types (system + user-created) with per-type item counts.
 */
export async function getItemTypesWithCounts(
  userId: string
): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
    },
    include: {
      _count: { select: { items: { where: { userId } } } },
    },
  });

  const displayOrder: Record<string, number> = {
    snippet: 0,
    prompt: 1,
    command: 2,
    note: 3,
    file: 4,
    image: 5,
    link: 6,
  };

  return types
    .map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      isSystem: t.isSystem,
      count: t._count.items,
    }))
    .sort((a, b) => {
      const orderA = displayOrder[a.name.toLowerCase()] ?? 99;
      const orderB = displayOrder[b.name.toLowerCase()] ?? 99;
      return orderA - orderB;
    });
}

export type SidebarUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

/**
 * Fetch items filtered by type name for a user.
 */
export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: {
      userId,
      itemType: { name: { equals: typeName, mode: "insensitive" } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  return items.map(serializeItem);
}

/**
 * Fetch a single item type by name.
 */
export async function getItemTypeByName(typeName: string) {
  return prisma.itemType.findFirst({
    where: { name: { equals: typeName, mode: "insensitive" }, isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  });
}

/**
 * Fetch minimal user info for the sidebar.
 */
export async function getSidebarUser(userId: string): Promise<SidebarUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
  return user;
}
