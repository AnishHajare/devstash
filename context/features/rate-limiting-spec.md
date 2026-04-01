# Rate Limiting — Production Implementation Spec

## Overview

Implement production-grade rate limiting on all auth and sensitive API endpoints to prevent brute-force attacks, credential stuffing, account enumeration, and email-sending abuse. Uses Upstash Redis with sliding window algorithm for serverless-compatible, distributed rate limiting.

---

## Architecture

### Technology

- **`@upstash/ratelimit`** — Serverless Redis-backed rate limiter
- **`@upstash/redis`** — Redis client for Upstash REST API
- **Sliding window algorithm** — Smooth, accurate limiting without burst edge cases
- **Fail-open design** — If Redis is unreachable, requests proceed (availability > security for non-critical paths)

### Core Module: `src/lib/rate-limit.ts`

Create a centralized rate-limiting utility that exposes pre-configured limiters and a helper to build 429 responses.

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Single Redis instance, reused across all limiters
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

**Exported limiters** (one per policy):

| Limiter Name | Algorithm | Limit | Window | Used By |
|---|---|---|---|---|
| `authLimiter` | Sliding window | 5 requests | 15 min | Login (credentials callback) |
| `registrationLimiter` | Sliding window | 3 requests | 1 hour | `/api/auth/register` |
| `passwordResetLimiter` | Sliding window | 3 requests | 1 hour | `/api/auth/forgot-password` |
| `resetTokenLimiter` | Sliding window | 5 requests | 15 min | `/api/auth/reset-password` |
| `emailLimiter` | Sliding window | 3 requests | 15 min | `/api/auth/resend-verification` |
| `changePasswordLimiter` | Sliding window | 5 requests | 15 min | `/api/profile/change-password` |
| `deleteAccountLimiter` | Sliding window | 3 requests | 1 hour | `/api/profile/delete-account` |
| `globalApiLimiter` | Sliding window | 60 requests | 1 min | General API fallback |

**Exported helpers:**

```ts
// Extract client IP with proxy-awareness (Vercel/Cloudflare)
function getClientIp(request: Request): string

// Build a composite key: "prefix:ip:identifier"
function rateLimitKey(prefix: string, ip: string, identifier?: string): string

// Check rate limit; returns { success, limit, remaining, reset }
// On failure, returns a pre-built 429 Response
async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<{ success: true; remaining: number; reset: number } | Response>
```

---

## Endpoint Protection Matrix

### Auth Endpoints

| Endpoint | Method | Limiter | Key Strategy | Notes |
|---|---|---|---|---|
| `/api/auth/callback/credentials` | POST | `authLimiter` | `login:{ip}:{email}` | Applied inside `authorize()` in `src/auth.ts`. Requires special handling (see Login section). |
| `/api/auth/register` | POST | `registrationLimiter` | `register:{ip}` | IP-only. Prevents mass account creation. |
| `/api/auth/forgot-password` | POST | `passwordResetLimiter` | `forgot:{ip}` | IP-only. Prevents email flooding. |
| `/api/auth/reset-password` | POST | `resetTokenLimiter` | `reset:{ip}` | IP-only. Prevents token brute-force. |
| `/api/auth/resend-verification` | POST | `emailLimiter` | `resend:{ip}:{email}` | IP + email. Prevents email flooding per-address. |

### Profile Endpoints (Authenticated)

| Endpoint | Method | Limiter | Key Strategy | Notes |
|---|---|---|---|---|
| `/api/profile/change-password` | POST | `changePasswordLimiter` | `chpw:{userId}` | Key by userId (authenticated). Prevents brute-forcing current password. |
| `/api/profile/delete-account` | DELETE | `deleteAccountLimiter` | `delacct:{userId}` | Key by userId. Extra safety on destructive action. |

### Future: General API Endpoints

| Endpoint | Method | Limiter | Key Strategy | Notes |
|---|---|---|---|---|
| `/api/items/*` | ALL | `globalApiLimiter` | `api:{userId}` | Applied later via middleware when CRUD endpoints are built. |
| `/api/collections/*` | ALL | `globalApiLimiter` | `api:{userId}` | Same as above. |
| `/api/ai/*` | ALL | Dedicated AI limiter | `ai:{userId}` | Tighter limits for AI endpoints (cost control). Define when AI features are built. |

---

## Implementation Details

### 1. IP Extraction (`getClientIp`)

Check headers in this order (first non-empty wins):

1. `x-forwarded-for` — Standard proxy header (Vercel, nginx). Take the **first** IP (leftmost = original client).
2. `x-real-ip` — Set by some proxies/CDNs.
3. `cf-connecting-ip` — Cloudflare-specific.
4. Fallback to `"unknown"` — Still rate-limited, just with a shared bucket.

```ts
function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();

  const cfip = request.headers.get("cf-connecting-ip");
  if (cfip) return cfip.trim();

  return "unknown";
}
```

### 2. Rate Limit Check (`checkRateLimit`)

```ts
async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<{ success: true; remaining: number; reset: number } | Response> {
  try {
    const result = await limiter.limit(key);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      return Response.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        }
      );
    }

    return {
      success: true,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fail open: if Redis is down, allow the request
    return { success: true, remaining: -1, reset: 0 };
  }
}
```

### 3. Login Rate Limiting (Special Case)

The credentials login flows through NextAuth's `authorize()` callback in `src/auth.ts`, not a normal route handler. This requires special handling:

**Approach:** Apply rate limiting inside the `authorize()` function itself.

```ts
// Inside authorize() in src/auth.ts
async authorize(credentials, request) {
  const email = credentials?.email as string | undefined;
  const password = credentials?.password as string | undefined;
  if (!email || !password) return null;

  // Rate limit check
  const ip = getClientIp(request);
  const key = rateLimitKey("login", ip, email);
  const rateCheck = await checkRateLimit(authLimiter, key);
  if (rateCheck instanceof Response) {
    throw new CredentialsSignin("TOO_MANY_ATTEMPTS");
  }

  // ... existing auth logic
}
```

The sign-in page must handle the `TOO_MANY_ATTEMPTS` error code and display an appropriate message.

### 4. Route Handler Pattern

For all other API routes, add rate limiting at the top of the handler:

```ts
// Example: /api/auth/register/route.ts
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(
    registrationLimiter,
    rateLimitKey("register", ip)
  );
  if (rateCheck instanceof Response) return rateCheck;

  // ... existing handler logic
}
```

### 5. Response Headers

All successful responses SHOULD include rate limit headers for observability:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1712000000000
```

429 responses MUST include:

```
Retry-After: 542
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712000000000
```

### 6. Frontend Error Handling

Update auth form components to handle 429 responses:

**Files to update:**
- `src/components/auth/sign-in-form.tsx` — Handle `TOO_MANY_ATTEMPTS` error code from NextAuth
- `src/components/auth/register-form.tsx` — Handle 429 from `/api/auth/register`
- `src/components/auth/forgot-password-form.tsx` — Handle 429 from `/api/auth/forgot-password`
- `src/components/auth/reset-password-form.tsx` — Handle 429 from `/api/auth/reset-password`
- `src/app/(auth)/sign-in/resend-verification.tsx` or similar — Handle 429 from `/api/auth/resend-verification`
- `src/components/dashboard/change-password-form.tsx` or similar — Handle 429 from `/api/profile/change-password`

**Pattern:**

```tsx
if (response.status === 429) {
  const data = await response.json();
  const minutes = Math.ceil(data.retryAfter / 60);
  toast.error(`Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
  return;
}
```

For the NextAuth sign-in (credentials), catch the error code:

```tsx
const result = await signIn("credentials", { redirect: false, ... });
if (result?.code === "TOO_MANY_ATTEMPTS") {
  toast.error("Too many login attempts. Please try again in 15 minutes.");
  return;
}
```

---

## Environment Variables

```env
# Already in .env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

No new env vars needed. Both are already configured.

---

## Fail-Open Strategy

Rate limiting must **never** block legitimate users due to infrastructure issues:

1. **Redis unavailable** — `checkRateLimit` catches errors and returns `{ success: true }`. Requests proceed unmetered.
2. **Missing env vars** — If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are unset, skip rate limiting entirely (log a warning in development). This allows local dev without Redis.
3. **Latency** — Upstash REST API adds ~1-5ms per call (edge-optimized). No meaningful impact on response times.

```ts
// At module level in rate-limit.ts
const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// checkRateLimit should early-return success if !isRedisConfigured
```

---

## Security Considerations

### IP Spoofing Mitigation

- `x-forwarded-for` can be spoofed if the app is not behind a trusted proxy. On Vercel, this header is set by the platform and cannot be forged by clients.
- For self-hosted deployments, configure the reverse proxy to overwrite (not append) `x-forwarded-for`.

### Key Design

- **Composite keys** (`ip:email`) prevent a single IP from being blocked across all accounts while still stopping targeted attacks on one account.
- **IP-only keys** for registration and forgot-password prevent enumeration attacks where the attacker cycles through emails.
- **UserId keys** for authenticated endpoints are more reliable than IP (shared office IPs won't cause false positives).

### Prefix Namespacing

All keys are prefixed with the endpoint name (`login:`, `register:`, `forgot:`, etc.) so that hitting one limit doesn't affect another. A user blocked from logging in can still reset their password.

---

## Monitoring & Observability

### Logging

Log rate limit events for security monitoring (keep it to `console.warn` for now; integrate with a logging service later):

```ts
if (!result.success) {
  console.warn(`[rate-limit] Blocked ${key} — limit: ${result.limit}, reset: ${result.reset}`);
}
```

### Future: Dashboard Metrics

When an admin dashboard is built, expose rate limit stats via Upstash Redis queries (blocked count per endpoint per time window). Not in scope now.

---

## Testing Plan

### Manual Testing

1. **Verify limiting works:** Call `/api/auth/register` 4 times rapidly from the same IP. Fourth request should return 429.
2. **Verify Retry-After header:** Parse the header and confirm it reflects actual time remaining.
3. **Verify fail-open:** Temporarily set invalid Redis credentials. Confirm requests still succeed.
4. **Verify key isolation:** Hit the register limit, then confirm forgot-password still works.
5. **Verify login limiting:** Attempt 6 wrong-password logins. Sixth should show rate limit error in the UI.
6. **Verify frontend UX:** Confirm toast messages appear with human-readable time remaining.

### Edge Cases

- **Concurrent requests:** Two requests arriving at the exact same millisecond should both be counted.
- **Window rollover:** After the window expires, the user should be able to make requests again without delay.
- **Mixed IPv4/IPv6:** Ensure IP extraction handles both formats.
- **Empty email in composite key:** If email is missing from the body, fall back to IP-only key.

---

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `src/lib/rate-limit.ts` | **Create** | Rate limiting utility — Redis client, limiters, helpers |
| `src/auth.ts` | **Modify** | Add rate limiting inside `authorize()` for credentials login |
| `src/app/api/auth/register/route.ts` | **Modify** | Add `registrationLimiter` check at top of POST handler |
| `src/app/api/auth/forgot-password/route.ts` | **Modify** | Add `passwordResetLimiter` check at top of POST handler |
| `src/app/api/auth/reset-password/route.ts` | **Modify** | Add `resetTokenLimiter` check at top of POST handler |
| `src/app/api/auth/resend-verification/route.ts` | **Modify** | Add `emailLimiter` check at top of POST handler |
| `src/app/api/profile/change-password/route.ts` | **Modify** | Add `changePasswordLimiter` check at top of POST handler |
| `src/app/api/profile/delete-account/route.ts` | **Modify** | Add `deleteAccountLimiter` check at top of DELETE handler |
| `src/components/auth/sign-in-form.tsx` | **Modify** | Handle `TOO_MANY_ATTEMPTS` error code |
| `src/components/auth/register-form.tsx` | **Modify** | Handle 429 response |
| `src/components/auth/forgot-password-form.tsx` | **Modify** | Handle 429 response |
| `src/components/auth/reset-password-form.tsx` | **Modify** | Handle 429 response |
| Sign-in resend verification component | **Modify** | Handle 429 response |
| Change password form component | **Modify** | Handle 429 response |
| `package.json` | **Modify** | Add `@upstash/ratelimit` and `@upstash/redis` |

---

## Dependencies to Install

```bash
npm install @upstash/ratelimit @upstash/redis
```

---

## Implementation Order

1. Install `@upstash/ratelimit` and `@upstash/redis`
2. Create `src/lib/rate-limit.ts` with all limiters and helpers
3. Add rate limiting to each API route handler (register, forgot-password, reset-password, resend-verification, change-password, delete-account)
4. Add rate limiting to `authorize()` in `src/auth.ts` for credentials login
5. Update frontend forms to handle 429 responses and `TOO_MANY_ATTEMPTS` error
6. Manual testing across all endpoints
