import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey, deleteAccountLimiter } from "@/lib/rate-limit";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(
    deleteAccountLimiter,
    rateLimitKey("delacct", session.user.id)
  );
  if (rateCheck instanceof Response) return rateCheck;

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return Response.json({ message: "Account deleted successfully" });
}
