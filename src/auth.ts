import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authLimiter, checkRateLimit, getClientIp, rateLimitKey } from "@/lib/rate-limit";
import { createLinkToken } from "@/lib/auth/link-token";
import authConfig from "./auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

class TooManyAttemptsError extends CredentialsSignin {
  code = "TOO_MANY_ATTEMPTS";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      // Only intercept OAuth sign-ins
      if (!account || account.type !== "oauth") return true;
      if (!user.email) return true;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: { where: { provider: account.provider } } },
      });

      // New user — allow normal OAuth sign-up
      if (!existingUser) return true;

      // Already linked with this provider — allow sign-in
      if (existingUser.accounts.length > 0) return true;

      // Email collision: existing user has no linked account for this provider
      // Create a signed JWT with the OAuth data and redirect to the link page
      const token = await createLinkToken({
        userId: existingUser.id,
        email: user.email,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        accessToken: account.access_token ?? undefined,
        refreshToken: account.refresh_token ?? undefined,
        expiresAt: account.expires_at ?? undefined,
        tokenType: account.token_type ?? undefined,
        scope: account.scope ?? undefined,
        idToken: account.id_token ?? undefined,
      });

      return `/link-account?token=${encodeURIComponent(token)}`;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  ...authConfig,
  providers: [
    ...authConfig.providers.filter(
      (p) => (p as { id?: string }).id !== "credentials"
    ),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // Rate limit login attempts by IP + email
        const ip = getClientIp(request);
        const key = rateLimitKey("login", ip, email);
        const rateCheck = await checkRateLimit(authLimiter, key);
        if (rateCheck instanceof Response) {
          throw new TooManyAttemptsError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        const requireVerification =
          process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
        if (requireVerification && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
