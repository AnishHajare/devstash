# Auth Security Audit — DevStash

**Audit Date:** 2026-04-01
**NextAuth Version:** 5.0.0-beta.30
**Auditor:** Claude (automated)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1     |
| HIGH     | 3     |
| MEDIUM   | 2     |
| LOW      | 2     |

The authentication system is well-structured overall, with correct use of cryptographic token generation, single-use token enforcement, proper session validation on protected API routes, and privacy-safe responses on sensitive endpoints. The primary critical issue is the use of bcrypt instead of the OWASP-preferred Argon2id for password hashing. Three high-severity issues were identified: no middleware.ts is exported (leaving route protection as dead code), the `proxy.ts` route guard is not wired into the Next.js middleware pipeline, and the `allowDangerousEmailAccountLinking` flag is enabled on GitHub OAuth without documented justification. No rate limiting is applied to any auth endpoint.

---

## Findings

---

### CRITICAL

#### [C-1] Route Protection Middleware Is Not Wired — Dashboard Is Unprotected

- **Severity:** CRITICAL
- **Location:** `src/proxy.ts` (entire file); no `src/middleware.ts` exists
- **Description:** Next.js only recognizes a middleware file at `src/middleware.ts` (or `middleware.ts` at the project root). The file `src/proxy.ts` exports a `proxy` function and a `config` matcher, but it is never imported anywhere and is therefore never executed. Any unauthenticated user can directly access `/dashboard` and all sub-routes.
- **Current Code:**
  ```ts
  // src/proxy.ts — this file is never invoked by Next.js
  export async function proxy(request: NextRequest) { ... }
  export const config = { matcher: ["/dashboard/:path*"] };
  ```
- **Recommended Fix:** Rename `src/proxy.ts` to `src/middleware.ts` and rename the export to `middleware`, which is what Next.js requires:
  ```ts
  // src/middleware.ts
  import { auth } from "@/auth";
  import { NextResponse } from "next/server";
  import type { NextRequest } from "next/server";

  export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtectedRoute = pathname.startsWith("/dashboard");
    if (!isProtectedRoute) return NextResponse.next();

    const session = await auth();
    if (!session) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  export const config = { matcher: ["/dashboard/:path*"] };
  ```
- **Effort:** 15 min

---

### HIGH

#### [H-1] bcrypt Used Instead of OWASP-Recommended Argon2id

- **Severity:** HIGH
- **Location:** `src/auth.ts:4`, `src/app/api/auth/register/route.ts:1,32`, `src/lib/auth/password-reset.ts:3,57`, `src/app/api/profile/change-password/route.ts:3,47`
- **Description:** All password hashing and verification uses `bcryptjs`. OWASP's Password Storage Cheat Sheet (current) recommends Argon2id as the first choice. bcrypt is classified as a legacy algorithm suitable only for systems where Argon2id/scrypt are unavailable. bcrypt is also limited to 72-byte passwords and is not memory-hard, making it more vulnerable to GPU-based cracking. The work factor is set to 12, which is acceptable but below the Argon2id recommendation.
- **Current Code:**
  ```ts
  import { hash } from "bcryptjs";
  const hashedPassword = await hash(password, 12);
  ```
- **Recommended Fix:** Replace `bcryptjs` with `@node-rs/argon2` (or the `argon2` npm package):
  ```ts
  import { hash, verify } from "@node-rs/argon2";

  // Hashing
  const hashedPassword = await hash(password, {
    memoryCost: 19456,   // 19 MiB — OWASP minimum
    timeCost: 2,
    parallelism: 1,
  });

  // Verification (constant-time, built-in)
  const isValid = await verify(user.password, candidatePassword);
  ```
  Update all four files: `register/route.ts`, `auth.ts`, `password-reset.ts`, `change-password/route.ts`.
- **Effort:** 1 hour

#### [H-2] `allowDangerousEmailAccountLinking: true` Enabled on GitHub OAuth

- **Severity:** HIGH
- **Location:** `src/auth.config.ts:10`
- **Description:** The `allowDangerousEmailAccountLinking` flag bypasses NextAuth's default protection against OAuth account-linking attacks. Normally, NextAuth refuses to link an OAuth account to an existing email/password account unless explicitly confirmed, because an attacker who controls a GitHub account with a target's email address could silently take over their DevStash account. This flag removes that protection entirely.
- **Current Code:**
  ```ts
  GitHub({ allowDangerousEmailAccountLinking: true }),
  ```
- **Recommended Fix:** Remove the flag (default `false`) unless there is a documented and accepted reason. If linking is intentionally desired, implement an explicit account-linking confirmation flow instead of silently linking. At minimum, add a comment documenting the risk accepted:
  ```ts
  GitHub({}),  // remove allowDangerousEmailAccountLinking
  ```
- **Effort:** 15 min (remove flag) / 1 day (safe linking flow)

#### [H-3] No Rate Limiting on Any Authentication Endpoint

- **Severity:** HIGH
- **Location:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/resend-verification/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/profile/change-password/route.ts`
- **Description:** None of the auth API routes apply rate limiting. This exposes the application to: (1) brute-force attacks against `/api/auth/[...nextauth]` credentials sign-in, (2) email flooding via `/api/auth/resend-verification` and `/api/auth/forgot-password` (an attacker can trigger unlimited emails to any address), and (3) token enumeration via `/api/auth/reset-password`. NextAuth's built-in CSRF protection does not address rate limiting.
- **Recommended Fix:** Add an edge-compatible rate limiter. The simplest approach for a Next.js/Vercel stack is `@upstash/ratelimit` with Redis, or the `rate-limiter-flexible` package for self-hosted:
  ```ts
  // Example with @upstash/ratelimit
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),  // 5 requests per 10 minutes
  });

  export async function POST(request: Request) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    // ... existing handler
  }
  ```
  Apply stricter limits (3-5 per hour by IP) to `/forgot-password` and `/resend-verification` specifically to prevent email abuse.
- **Effort:** 1 day

---

### MEDIUM

#### [M-1] Password Reset Token Stored as Plaintext

- **Severity:** MEDIUM
- **Location:** `src/lib/auth/password-reset.ts:16-26`, `src/lib/auth/verification.ts:12-23`
- **Description:** Both `createPasswordResetToken` and `createVerificationToken` store the raw token hex string directly in the database. OWASP's Forgot Password Cheat Sheet recommends hashing tokens before storage (e.g., SHA-256). If the `verification_token` table is compromised via SQL injection or a database breach, all outstanding tokens are immediately usable to reset passwords or verify accounts.
- **Current Code:**
  ```ts
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { identifier, token, expires } });
  return token;  // raw token returned and emailed
  ```
- **Recommended Fix:** Store a SHA-256 hash of the token; compare by hashing the incoming token before lookup:
  ```ts
  import { createHash } from "crypto";

  function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // On create: store hash, return raw
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  await prisma.verificationToken.create({ data: { identifier, token: tokenHash, expires } });
  return rawToken;

  // On verify: hash incoming token, look up by hash
  const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(incomingToken) } });
  ```
- **Effort:** 1 hour

#### [M-2] Minimum Password Length Set to 6 Characters in Reset Flow (Inconsistent Validation)

- **Severity:** MEDIUM
- **Location:** `src/app/api/auth/reset-password/route.ts:21`
- **Description:** The password reset API enforces a minimum of 6 characters, while the change-password API enforces 8 characters. This inconsistency means a user can set a weaker password via the password reset flow than would be accepted via the profile page. The 6-character minimum does not meet the OWASP recommendation of at least 8 characters.
- **Current Code:**
  ```ts
  // reset-password/route.ts
  if (password.length < 6) { ... }

  // change-password/route.ts
  if (newPassword.length < 8) { ... }
  ```
- **Recommended Fix:** Unify password validation in a shared utility and enforce a minimum of 8 characters (OWASP minimum) across all flows:
  ```ts
  // src/lib/auth/password-validation.ts
  export function validatePassword(password: string): string | null {
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }
  ```
- **Effort:** 15 min

---

### LOW

#### [L-1] `AUTH_SECRET` Appears Hardcoded in `.env` (Low Entropy Warning)

- **Severity:** LOW
- **Location:** `.env:2`
- **Description:** The `AUTH_SECRET` value present in `.env` is 64 hex characters (32 bytes), which is sufficient entropy. However, the same secret value appears in `.env.production`, meaning both environments share a single signing key. If the development secret is ever compromised or rotated, the production secret is exposed as well. The `.env` files are correctly gitignored and do not appear in git history.
- **Recommended Fix:** Use distinct `AUTH_SECRET` values for each environment. Generate a fresh secret with `openssl rand -hex 32` or `npx auth secret`.
- **Effort:** 15 min

#### [L-2] `callbackUrl` Not Validated in Proxy Redirect

- **Severity:** LOW (Warning: Confidence: 78%)
- **Location:** `src/proxy.ts:13-15`
- **Description:** The proxy sets `callbackUrl` to `request.url` (the full URL the user requested) and appends it as a query parameter to the sign-in redirect. If a user visits a URL like `/dashboard?callbackUrl=https://evil.com`, the sign-in page could use that as a redirect target after login. This depends on how the sign-in page consumes `callbackUrl` — if it blindly uses `searchParams.get("callbackUrl")` from the URL (not the one set by NextAuth internally), an open redirect is possible.
- **Current Code:**
  ```ts
  signInUrl.searchParams.set("callbackUrl", request.url);
  ```
- **Recommended Fix:** Validate that the `callbackUrl` is a relative path on the same origin before using it. NextAuth's built-in `signIn()` callback handling already does this for its own redirects, so the safest approach is to let NextAuth handle `callbackUrl` rather than setting it manually:
  ```ts
  // Let NextAuth handle the callbackUrl internally, or validate:
  const safeCallback = pathname; // redirect to the path only, not full URL
  signInUrl.searchParams.set("callbackUrl", safeCallback);
  ```
- **Effort:** 15 min

---

## Passed Checks

The following security controls were verified and are implemented correctly:

- **Cryptographically secure token generation:** Both `createVerificationToken` and `createPasswordResetToken` use `crypto.randomBytes(32)` (256 bits of entropy), which meets and exceeds the 128-bit minimum.
- **Token expiration enforced:** Email verification tokens expire in 24 hours; password reset tokens expire in 1 hour. Both are validated server-side before use.
- **Single-use token enforcement:** Both token flows delete the token atomically within a `$transaction` alongside the state-change operation (user update). This prevents replay attacks.
- **Old tokens invalidated on re-request:** `deleteMany` is called before creating a new token in both flows, preventing token accumulation.
- **Password change requires current password:** `change-password/route.ts` fetches the stored hash and verifies the current password before allowing an update.
- **Session validation on all protected API routes:** `change-password` and `delete-account` both call `auth()` and check `session?.user?.id` before executing.
- **No cross-user data modification:** Profile API routes use `session.user.id` from the JWT for all DB operations — no user-supplied ID is trusted.
- **Privacy-safe responses:** `forgot-password`, `resend-verification` all return identical responses regardless of whether the email exists.
- **Email UNIQUE constraint:** Enforced in schema (`email String? @unique` on `User`).
- **bcrypt work factor:** Set to 12 (above the legacy minimum of 10), though migration to Argon2id is still recommended.
- **Token expiration field exists in schema:** `VerificationToken.expires` is present and checked at the application layer.
- **GitHub OAuth users auto-verified:** `emailVerified` is set correctly for OAuth sign-ups; they are not blocked by the email verification gate.
- **NextAuth handles CSRF, cookie flags, JWT signing, and OAuth state/nonce:** Not audited as these are managed by NextAuth v5 internals.

---

## Unable to Audit

- **Session invalidation on password change:** The JWT strategy does not support server-side session revocation natively. After a password change or account deletion, existing JWT sessions remain valid until they expire naturally. This is a known limitation of stateless JWTs in NextAuth and would require switching to a database session strategy or implementing a token revocation list to address. Not flagged as a finding due to being a known framework tradeoff, but worth noting.
- **Email content injection:** The `sendVerificationEmail` and `sendPasswordResetEmail` functions interpolate `email` and `token` values directly into HTML. The `token` is a random hex string (safe). The `email` value comes from the database (not directly from user input at send time), which reduces but does not eliminate risk if the database is writable. Confidence too low (60%) to flag as a finding.
- **Prisma migration history:** The actual migration SQL files were not reviewed to confirm schema integrity matches `schema.prisma`. Recommend a separate review of `prisma/migrations/`.
- **`next.config.ts` security headers:** Content-Security-Policy, X-Frame-Options, and other HTTP security headers were not examined — outside the auth audit scope but recommended as a follow-up.

---

## Metadata

- **Files Examined:** 17
- **Patterns Searched:** bcrypt, argon2, hash, randomBytes, token, password, secret, process.env, middleware, proxy
- **Web Searches Performed:** 3
  1. OWASP password hashing recommendations — bcrypt vs Argon2id (2025)
  2. Password reset token expiry and storage best practices (2025)
  3. NextAuth v5 built-in security features (CSRF, session, cookie protection)

---

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Password Hashing Guide 2025: Argon2 vs Bcrypt](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/)
- [Secure Password Reset Tokens — Best Practices](https://vjnvisakh.medium.com/secure-password-reset-tokens-expiry-and-system-design-best-practices-337c6161af5a)
- [NextAuth.js v5 Security Features](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide)
