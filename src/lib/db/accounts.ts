import { prisma } from "@/lib/prisma";

export async function getLinkedAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, type: "oauth" },
    select: { provider: true, providerAccountId: true },
  });
}

export async function unlinkAccount(userId: string, provider: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { password: true },
  });

  if (!user.password) {
    throw new Error("Cannot unlink your only sign-in method. Set a password first.");
  }

  await prisma.account.deleteMany({
    where: { userId, provider },
  });
}
