import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { checkRateLimit, rateLimitKey, changePasswordLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = await checkRateLimit(
    changePasswordLimiter,
    rateLimitKey("chpw", session.user.id)
  );
  if (rateCheck instanceof Response) return rateCheck;

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return Response.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user.password) {
    return Response.json(
      { error: "Password change is not available for OAuth accounts" },
      { status: 400 }
    );
  }

  const isValid = await compare(currentPassword, user.password);
  if (!isValid) {
    return Response.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return Response.json({ message: "Password updated successfully" });
}
