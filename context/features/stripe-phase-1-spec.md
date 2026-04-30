# Stripe Integration Phase 1 — Core Infrastructure Spec

## Overview

Install Stripe, configure the client, add `isPro` to the auth session, create checkout and portal API routes, and build the feature-gating utility with unit tests. This phase establishes all server-side Stripe infrastructure without requiring the Stripe CLI or live webhook testing.

---

## Architecture

### Dependencies

```bash
npm install stripe
```

### Environment Variables

Add to `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

No Prisma migration needed — `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` already exist on the User model.

---

## Implementation Steps

### Step 1: Stripe Client & Plan Config

**New file: `src/lib/stripe.ts`**

```ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    price: 8,
    interval: "month" as const,
  },
  annual: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    price: 72,
    interval: "year" as const,
  },
} as const;

export type PlanInterval = keyof typeof PLANS;
```

---

### Step 2: Add `isPro` to JWT & Session

**Modify: `src/auth.ts`**

In the `jwt` callback, always sync `isPro` from the database so webhook-driven changes are picked up on the next session check:

```ts
async jwt({ token, user }) {
  if (user?.id) {
    token.id = user.id;
  }

  // Always sync isPro from DB to catch webhook updates
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }

  return token;
},
session({ session, token }) {
  if (token.id) {
    session.user.id = token.id as string;
  }
  session.user.isPro = (token.isPro as boolean) ?? false;
  return session;
},
```

**Modify: `src/types/next-auth.d.ts`**

Add `isPro` to Session user and JWT:

```ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isPro: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
  }
}
```

---

### Step 3: Checkout API Route

**New file: `src/app/api/stripe/checkout/route.ts`**

- `POST` handler, requires auth
- Validates `{ plan: "monthly" | "annual" }` with Zod
- Rejects if user is already Pro
- Gets or creates Stripe customer (saves `stripeCustomerId` to DB)
- Creates a Stripe Checkout session in `subscription` mode
- Returns `{ url }` for client-side redirect
- `success_url`: `/settings?upgraded=true`
- `cancel_url`: `/settings`
- Sets `metadata.userId` on the subscription for webhook lookup

---

### Step 4: Portal API Route

**New file: `src/app/api/stripe/portal/route.ts`**

- `POST` handler, requires auth
- Looks up user's `stripeCustomerId`
- Returns 400 if no billing account
- Creates a Stripe Billing Portal session
- Returns `{ url }` for client-side redirect
- `return_url`: `/settings`

---

### Step 5: Feature Gate Utility

**New file: `src/lib/feature-gate.ts`**

Centralized free/pro limit checks:

```ts
import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export async function canCreateItem(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_LIMITS.items;
}

export async function canCreateCollection(
  userId: string,
  isPro: boolean
): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.collection.count({ where: { userId } });
  return count < FREE_LIMITS.collections;
}

export function canUseProType(isPro: boolean): boolean {
  return isPro;
}

export function canUseAI(isPro: boolean): boolean {
  return isPro;
}
```

---

### Step 6: Update Profile DB Query

**Modify: `src/lib/db/profile.ts`**

Add `isPro` and `stripeCustomerId` to the `select` in `getUserProfile` so the settings page can display billing status.

---

## Unit Tests

**New file: `src/lib/__tests__/feature-gate.test.ts`**

Mock Prisma (`vi.mock("@/lib/prisma")`). Test the following:

| Test | Expected |
|---|---|
| `canCreateItem` — pro user, any count | returns `true` |
| `canCreateItem` — free user, 49 items | returns `true` |
| `canCreateItem` — free user, 50 items | returns `false` |
| `canCreateItem` — free user, 51 items | returns `false` |
| `canCreateCollection` — pro user, any count | returns `true` |
| `canCreateCollection` — free user, 2 collections | returns `true` |
| `canCreateCollection` — free user, 3 collections | returns `false` |
| `canUseProType(true)` | returns `true` |
| `canUseProType(false)` | returns `false` |
| `canUseAI(true)` | returns `true` |
| `canUseAI(false)` | returns `false` |
| `FREE_LIMITS.items` | equals `50` |
| `FREE_LIMITS.collections` | equals `3` |

---

## Files Summary

### New Files

| File | Purpose |
|---|---|
| `src/lib/stripe.ts` | Stripe client singleton + plan config |
| `src/lib/feature-gate.ts` | Free/pro limit checks |
| `src/app/api/stripe/checkout/route.ts` | Creates Stripe Checkout session |
| `src/app/api/stripe/portal/route.ts` | Opens Stripe Customer Portal |
| `src/lib/__tests__/feature-gate.test.ts` | Unit tests for feature gating |

### Modified Files

| File | Change |
|---|---|
| `src/auth.ts` | Sync `isPro` in JWT callback, expose in session |
| `src/types/next-auth.d.ts` | Add `isPro` to Session and JWT types |
| `src/lib/db/profile.ts` | Include `isPro`, `stripeCustomerId` in select |
| `.env` | Add 6 Stripe environment variables |

---

## Verification

- `npm run build` passes
- `npm test` passes (new feature-gate tests + existing 142 tests)
- Checkout route returns 401 for unauthenticated requests
- Portal route returns 400 for users without `stripeCustomerId`
- `session.user.isPro` is accessible in server and client components
