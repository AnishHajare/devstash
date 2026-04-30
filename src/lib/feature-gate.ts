import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export async function canCreateItem(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true;

  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_LIMITS.items;
}

export async function canCreateCollection(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true;

  const count = await prisma.collection.count({ where: { userId } });
  return count < FREE_LIMITS.collections;
}

export function canUseProType(isPro: boolean): boolean {
  return isPro;
}

export function canUseAI(isPro: boolean): boolean {
  return isPro;
}
