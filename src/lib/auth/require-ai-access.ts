import { canUseAI } from "@/lib/feature-gate";
import {
  aiActionLimiter,
  checkRateLimit,
  rateLimitKey,
} from "@/lib/rate-limit";
import type { AuthFailure } from "@/lib/auth/require-auth";

export type RequireAIAccessResult = { success: true } | AuthFailure;

export async function requireAIAccess(
  userId: string,
  isPro: boolean,
  keySlug: string
): Promise<RequireAIAccessResult> {
  if (!canUseAI(isPro)) {
    return { success: false, error: "Upgrade to Pro to use AI features." };
  }
  const rate = await checkRateLimit(
    aiActionLimiter,
    rateLimitKey(keySlug, userId)
  );
  if (rate instanceof Response) {
    return {
      success: false,
      error: "Too many AI requests. Please wait and try again.",
    };
  }
  return { success: true };
}
