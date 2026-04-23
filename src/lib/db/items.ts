import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

export type ItemWithType = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
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

export type PaginatedItems = {
  items: ItemWithType[];
  totalCount: number;
};

export type SearchableItem = {
  id: string;
  title: string;
  type: {
    name: string;
    icon: string;
    color: string;
  };
  preview: string | null;
};

export function serializeItem(item: {
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

function getItemSearchPreview(item: {
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
}): string | null {
  const preview = item.description ?? item.content ?? item.url ?? item.fileName;
  if (!preview) return null;

  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

type PrismaItemDetail = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { id: string; name: string }[];
  collections: { collection: { id: string; name: string } }[];
  itemType: { id: string; name: string; icon: string; color: string };
};

function toItemDetail(item: PrismaItemDetail): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    url: item.url,
    language: item.language,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    tags: item.tags,
    collections: item.collections.map((ic) => ic.collection),
    itemType: item.itemType,
  };
}

async function getOwnedCollectionIds(
  userId: string,
  collectionIds: string[]
): Promise<string[]> {
  const uniqueCollectionIds = [...new Set(collectionIds)];

  if (uniqueCollectionIds.length === 0) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId,
      id: { in: uniqueCollectionIds },
    },
    select: { id: true },
  });

  if (collections.length !== uniqueCollectionIds.length) {
    throw new Error("Invalid collection selection");
  }

  return collections.map((collection) => collection.id);
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
 * Fetch favorite items for a user sorted by most recently updated.
 */
export async function getFavoriteItems(
  userId: string
): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  return items.map(serializeItem);
}

/**
 * Fetch lightweight item records for client-side global search.
 */
export async function getSearchableItems(
  userId: string
): Promise<SearchableItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      fileName: true,
      itemType: {
        select: {
          name: true,
          icon: true,
          color: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.itemType,
    preview: getItemSearchPreview(item),
  }));
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
 * Fetch one page of items filtered by type name for a user.
 */
export async function getPaginatedItemsByType(
  userId: string,
  typeName: string,
  {
    skip,
    take,
  }: {
    skip: number;
    take: number;
  }
): Promise<PaginatedItems> {
  const where = {
    userId,
    itemType: { name: { equals: typeName, mode: "insensitive" as const } },
  };

  const [items, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take,
      include: {
        itemType: { select: { id: true, name: true, icon: true, color: true } },
        tags: { select: { id: true, name: true } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(serializeItem),
    totalCount,
  };
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

export type ItemDetail = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
};

/**
 * Fetch full item detail for the drawer.
 */
export async function getItemDetail(
  id: string,
  userId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: {
          collection: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!item) return null;

  return toItemDetail(item);
}

export type CreateItemInput = {
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  collectionIds: string[];
  itemTypeId: string;
  userId: string;
};

/**
 * Create a new item with optional tags.
 */
export async function createItem(data: CreateItemInput): Promise<ItemDetail> {
  const collectionIds = await getOwnedCollectionIds(data.userId, data.collectionIds);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      userId: data.userId,
      itemTypeId: data.itemTypeId,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({
          collection: { connect: { id: collectionId } },
        })),
      },
    },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  return toItemDetail(item);
}

export type UpdateItemInput = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
};

/**
 * Update an item and replace its tags.
 */
export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemInput
): Promise<ItemDetail | null> {
  const nextCollectionIds = await getOwnedCollectionIds(userId, data.collectionIds);

  const existingItem = await prisma.item.findFirst({
    where: { id, userId },
    select: {
      collections: {
        select: { collectionId: true },
      },
    },
  });

  if (!existingItem) {
    return null;
  }

  const existingCollectionIds = existingItem.collections.map(
    (collection) => collection.collectionId
  );
  const collectionIdsToConnect = nextCollectionIds.filter(
    (collectionId) => !existingCollectionIds.includes(collectionId)
  );
  const collectionIdsToDisconnect = existingCollectionIds.filter(
    (collectionId) => !nextCollectionIds.includes(collectionId)
  );

  const item = await prisma.item.update({
    where: { id, userId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        create: collectionIdsToConnect.map((collectionId) => ({
          collection: { connect: { id: collectionId } },
        })),
        deleteMany: {
          collectionId: {
            in: collectionIdsToDisconnect,
          },
        },
      },
    },
    include: {
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  return toItemDetail(item);
}

/**
 * Toggle the isPinned flag on an item, scoped to the owning user.
 * Returns true if updated, false if not found or not owned.
 */
export async function toggleItemPin(
  id: string,
  userId: string,
  isPinned: boolean
): Promise<boolean> {
  const result = await prisma.item.updateMany({
    where: { id, userId },
    data: { isPinned },
  });
  return result.count > 0;
}

/**
 * Toggle the isFavorite flag on an item, scoped to the owning user.
 * Returns true if updated, false if not found or not owned.
 */
export async function toggleItemFavorite(
  id: string,
  userId: string,
  isFavorite: boolean
): Promise<boolean> {
  const result = await prisma.item.updateMany({
    where: { id, userId },
    data: { isFavorite },
  });
  return result.count > 0;
}

/**
 * Delete an item by id, scoped to the owning user.
 * Also removes the R2 file if the item has one.
 * Returns true if deleted, false if not found or not owned.
 */
export async function deleteItem(id: string, userId: string): Promise<boolean> {
  try {
    const item = await prisma.item.delete({
      where: { id, userId },
      select: { fileUrl: true },
    });
    if (item.fileUrl) {
      await deleteFromR2(item.fileUrl).catch(() => {
        // Best-effort: log but don't fail if R2 delete errors
        console.error(`Failed to delete R2 object: ${item.fileUrl}`);
      });
    }
    return true;
  } catch {
    return false;
  }
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
