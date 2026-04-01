import { prisma } from "@/lib/prisma";

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  hasPassword: boolean;
};

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  itemsByType: { name: string; icon: string; color: string; count: number }[];
};

/**
 * Fetch user profile data and aggregated stats in a single query.
 */
export async function getUserProfile(
  userId: string
): Promise<{ user: UserProfile; stats: ProfileStats }> {
  const [userData, totalItems, totalCollections, typeCounts] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          password: true,
          createdAt: true,
        },
      }),
      prisma.item.count({ where: { userId } }),
      prisma.collection.count({ where: { userId } }),
      prisma.itemType.findMany({
        where: {
          OR: [{ isSystem: true }, { userId }],
        },
        select: {
          name: true,
          icon: true,
          color: true,
          _count: { select: { items: { where: { userId } } } },
        },
      }),
    ]);

  return {
    user: {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      createdAt: userData.createdAt.toISOString(),
      hasPassword: !!userData.password,
    },
    stats: {
      totalItems,
      totalCollections,
      itemsByType: typeCounts
        .map((t) => ({
          name: t.name,
          icon: t.icon,
          color: t.color,
          count: t._count.items,
        }))
        .sort((a, b) => b.count - a.count),
    },
  };
}
