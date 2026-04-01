import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function createLimiter(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: "ratelimit",
  });
}

// ─── Pre-configured limiters ───────────────────────────────

export const authLimiter = createLimiter(5, "15 m");
export const registrationLimiter = createLimiter(3, "1 h");
export const passwordResetLimiter = createLimiter(3, "1 h");
export const resetTokenLimiter = createLimiter(5, "15 m");
export const emailLimiter = createLimiter(3, "15 m");
export const changePasswordLimiter = createLimiter(5, "15 m");
export const deleteAccountLimiter = createLimiter(3, "1 h");

// ─── Helpers ───────────────────────────────────────────────

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();

  const cfip = request.headers.get("cf-connecting-ip");
  if (cfip) return cfip.trim();

  return "unknown";
}

export function rateLimitKey(prefix: string, ip: string, identifier?: string): string {
  return identifier ? `${prefix}:${ip}:${identifier}` : `${prefix}:${ip}`;
}

type RateLimitSuccess = { success: true; remaining: number; reset: number };

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitSuccess | Response> {
  // Fail open if Redis is not configured
  if (!limiter) {
    return { success: true, remaining: -1, reset: 0 };
  }

  try {
    const result = await limiter.limit(key);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      console.warn(`[rate-limit] Blocked ${key} — limit: ${result.limit}, reset: ${result.reset}`);
      return Response.json(
        { error: "Too many requests. Please try again later.", retryAfter },
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

    return { success: true, remaining: result.remaining, reset: result.reset };
  } catch {
    // Fail open: if Redis is down, allow the request
    return { success: true, remaining: -1, reset: 0 };
  }
}
