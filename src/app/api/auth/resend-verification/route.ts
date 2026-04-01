import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/auth/verification";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitKey, emailLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { email } = await request.json();

  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(
    emailLimiter,
    rateLimitKey("resend", ip, email || undefined)
  );
  if (rateCheck instanceof Response) return rateCheck;

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal whether the user exists
  if (!user || user.emailVerified) {
    return Response.json({
      message: "If that email exists and is unverified, a new link has been sent.",
    });
  }

  const token = await createVerificationToken(email);
  await sendVerificationEmail(email, token);

  return Response.json({
    message: "If that email exists and is unverified, a new link has been sent.",
  });
}
