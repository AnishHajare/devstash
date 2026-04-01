import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitKey, passwordResetLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(passwordResetLimiter, rateLimitKey("forgot", ip));
  if (rateCheck instanceof Response) return rateCheck;

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { message: "Email is required." },
      { status: 400 }
    );
  }

  // Always return the same response to avoid leaking user existence
  const successMessage =
    "If an account exists with that email, you will receive a password reset link.";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { select: { provider: true } } },
  });

  if (!user || !user.password) {
    // User doesn't exist or is OAuth-only — don't reveal this
    return NextResponse.json({ message: successMessage });
  }

  const token = await createPasswordResetToken(email);
  await sendPasswordResetEmail(email, token);

  return NextResponse.json({ message: successMessage });
}
