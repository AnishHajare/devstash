import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { verifyLinkToken } from "@/lib/auth/link-token";
import { checkRateLimit, getClientIp, rateLimitKey, linkAccountLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(linkAccountLimiter, rateLimitKey("link", ip));
  if (rateCheck instanceof Response) return rateCheck;

  const { token, password } = await request.json();

  if (!token || !password) {
    return Response.json(
      { error: "Token and password are required." },
      { status: 400 }
    );
  }

  // Verify the signed JWT
  let payload;
  try {
    payload = await verifyLinkToken(token);
  } catch {
    return Response.json(
      { error: "This link has expired. Please try signing in with GitHub again." },
      { status: 400 }
    );
  }

  // Look up the user and verify password
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, password: true },
  });

  if (!user || !user.password) {
    return Response.json(
      { error: "Account not found or no password set." },
      { status: 400 }
    );
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    return Response.json(
      { error: "Incorrect password." },
      { status: 400 }
    );
  }

  // Guard: check if account is already linked (race condition)
  const existing = await prisma.account.findFirst({
    where: { userId: user.id, provider: payload.provider },
  });

  if (existing) {
    return Response.json(
      { error: "This provider is already linked to your account." },
      { status: 400 }
    );
  }

  // Create the Account record to link the OAuth provider
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "oauth",
      provider: payload.provider,
      providerAccountId: payload.providerAccountId,
      access_token: payload.accessToken ?? null,
      refresh_token: payload.refreshToken ?? null,
      expires_at: payload.expiresAt ?? null,
      token_type: payload.tokenType ?? null,
      scope: payload.scope ?? null,
      id_token: payload.idToken ?? null,
    },
  });

  return Response.json({
    success: true,
    email: user.email,
  });
}
