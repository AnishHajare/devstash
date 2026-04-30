# Stripe Subscription Integration Plan

> DevStash Pro: $8/month or $72/year (save 25%)

---

## 1. Current State Analysis

### User Model (prisma/schema.prisma)

The schema already has the required fields on the `User` model:

```prisma
isPro                Boolean      @default(false)
stripeCustomerId     String?      @unique
stripeSubscriptionId String?      @unique
```

No migration needed for core Stripe fields.

### NextAuth Configuration (src/auth.ts)

- JWT session strategy with `PrismaAdapter`
- `jwt` callback sets `token.id` from `user.id`
- `session` callback exposes `session.user.id`
- **`isPro` is NOT in the session or JWT token** — needs to be added
- Session type extended in `src/types/next-auth.d.ts` (only `id` currently)

### Data Access Patterns

- **Server actions** (`src/actions/*.ts`): use `auth()` to get `session.user.id`, then call DB functions
- **API routes** (`src/app/api/**`): same `auth()` pattern with `NextResponse.json()`
- **Server components** (layouts/pages): `auth()` + redirect if unauthenticated
- **Pattern**: `{ success: true; data } | { success: false; error: string }` return type
- **Validation**: Zod schemas for all inputs

### Environment Variables

Current pattern: direct `process.env.X` access with optional guards (e.g., `prisma.ts` DB guard, `rate-limit.ts` Redis guard). New Stripe vars will follow the same pattern.

### Rate Limiting

Upstash Redis with `@upstash/ratelimit`, fail-open design. Can reuse the pattern for Stripe webhook endpoint if needed.

---

## 2. Feature Gating Analysis

### Free Tier Limits

| Resource    | Free Limit | Where to enforce                                               |
|-------------|------------|----------------------------------------------------------------|
| Items       | 50 total   | `createItem` server action + `dbCreateItem` DB fn              |
| Collections | 3 total    | `createCollection` server action + `dbCreateCollection` DB fn  |

### Pro-Only Features

| Feature           | Current Location                              | Gating Strategy                              |
|-------------------|-----------------------------------------------|----------------------------------------------|
| File/Image types  | `PRO_SYSTEM_TYPES` in `item-type-constants.ts`| Block in `createItem` action + hide UI       |
| AI features       | Not yet implemented                           | Gate at AI API routes                        |
| Custom types      | Not yet implemented                           | Gate at create-type action                   |
| Export (JSON/ZIP) | Not yet implemented                           | Gate at export API route                     |
| Unlimited items   | `createItem` action                           | Count check before create                    |
| Unlimited colls   | `createCollection` action                     | Count check before create                    |

### Where Counts Are Already Available

- `src/lib/db/profile.ts`: `prisma.item.count({ where: { userId } })` and `prisma.collection.count({ where: { userId } })`
- `src/lib/db/items.ts`: `getItemStats()` returns total + favorite counts
- Sidebar: `getItemTypesWithCounts()` returns per-type counts

---

## 3. Implementation Plan

### Phase 1: Install & Configure Stripe

#### 3.1 Install dependency

```bash
npm install stripe
```

#### 3.2 Environment variables

Add to `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 3.3 Create: `src/lib/stripe.ts`

```typescript
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

### Phase 2: Add `isPro` to Session

#### 3.4 Modify: `src/auth.ts` — JWT callback

Per the research note, always sync `isPro` from DB to catch webhook updates:

```typescript
async jwt({ token, user }) {
  if (user?.id) {
    token.id = user.id;
  }

  // Always sync isPro from database to catch webhook updates
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

#### 3.5 Modify: `src/types/next-auth.d.ts`

```typescript
import "next-auth";

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

### Phase 3: Checkout & Portal API Routes

#### 3.6 Create: `src/app/api/stripe/checkout/route.ts`

Creates a Stripe Checkout session for the selected plan.

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const selectedPlan = PLANS[plan];

  // Get or create Stripe customer
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, isPro: true },
  });

  if (user.isPro) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    subscription_data: {
      metadata: { userId: session.user.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

#### 3.7 Create: `src/app/api/stripe/portal/route.ts`

Opens the Stripe customer portal for managing subscriptions.

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

---

### Phase 4: Webhook Handler

#### 3.8 Create: `src/app/api/stripe/webhook/route.ts`

Handles Stripe webhook events to sync subscription state.

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.subscription
        ? (
            await stripe.subscriptions.retrieve(
              session.subscription as string
            )
          ).metadata.userId
        : null;

      if (userId && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: true,
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      if (!userId) break;

      const isActive = ["active", "trialing"].includes(subscription.status);
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPro: isActive,
          stripeSubscriptionId: isActive ? subscription.id : null,
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: {
          isPro: false,
          stripeSubscriptionId: null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Important**: This route must NOT use the `auth()` middleware — Stripe sends webhooks server-to-server. The raw body must be read with `req.text()` (not `req.json()`) for signature verification.

---

### Phase 5: Feature Gating

#### 3.9 Create: `src/lib/feature-gate.ts`

Centralized limit checking.

```typescript
import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_LIMITS.items;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
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

#### 3.10 Modify: `src/actions/items.ts` — add limit check to `createItem`

```typescript
import { canCreateItem, canUseProType } from "@/lib/feature-gate";
import { PRO_SYSTEM_TYPES } from "@/lib/item-type-constants";

// Inside createItem, after auth check:
const isPro = session.user.isPro ?? false;

if (PRO_SYSTEM_TYPES.includes(parsed.data.typeName) && !canUseProType(isPro)) {
  return { success: false, error: "File and Image types require DevStash Pro" };
}

if (!(await canCreateItem(session.user.id, isPro))) {
  return { success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." };
}
```

#### 3.11 Modify: `src/actions/collections.ts` — add limit check to `createCollection`

```typescript
import { canCreateCollection } from "@/lib/feature-gate";

// Inside createCollection, after auth check:
const isPro = session.user.isPro ?? false;

if (!(await canCreateCollection(session.user.id, isPro))) {
  return { success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections." };
}
```

---

### Phase 6: Billing UI

#### 3.12 Create: `src/components/account/billing-section.tsx`

Client component for the settings page showing current plan and upgrade/manage buttons.

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BillingSectionProps {
  isPro: boolean;
  hasStripeCustomer: boolean;
}

export function BillingSection({ isPro, hasStripeCustomer }: BillingSectionProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout(plan: "monthly" | "annual") {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || "Failed to start checkout");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || "Failed to open billing portal");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-emerald-600">PRO</Badge>
          <span className="text-sm text-muted-foreground">
            You have full access to all DevStash features.
          </span>
        </div>
        {hasStripeCustomer && (
          <Button variant="outline" onClick={handlePortal} disabled={loading}>
            {loading ? "Opening..." : "Manage Subscription"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You are on the <strong>Free</strong> plan. Upgrade to Pro for unlimited
        items, collections, file uploads, and AI features.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => handleCheckout("monthly")} disabled={loading}>
          {loading ? "Loading..." : "Upgrade — $8/mo"}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleCheckout("annual")}
          disabled={loading}
        >
          {loading ? "Loading..." : "Upgrade — $72/yr (save 25%)"}
        </Button>
      </div>
    </div>
  );
}
```

#### 3.13 Modify: `src/app/settings/page.tsx` — add Billing section

Add a new "Billing" section between Account and Appearance:

```typescript
import { BillingSection } from "@/components/account/billing-section";

// In the parallel data fetch, add:
const user = ...; // already fetched
// user object already has isPro from getUserProfile

// Add section after Account:
<section className="space-y-3">
  <div>
    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
      Billing
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">
      Manage your subscription and payment details.
    </p>
  </div>
  <Card>
    <CardHeader>
      <CardTitle>Subscription</CardTitle>
      <CardDescription>
        Your current plan and billing options.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <BillingSection
        isPro={user.isPro}
        hasStripeCustomer={!!user.stripeCustomerId}
      />
    </CardContent>
  </Card>
</section>
```

**Note**: `getUserProfile` in `src/lib/db/profile.ts` needs to include `isPro` and `stripeCustomerId` in its select.

#### 3.14 Modify: `src/lib/db/profile.ts` — include billing fields

Add `isPro` and `stripeCustomerId` to the user select in `getUserProfile`.

---

### Phase 7: Pro Badge & UI Indicators

#### 3.15 Modify: `src/components/dashboard/sidebar-content.tsx`

The sidebar already shows PRO badges on File/Image types. After integration:

- Show a "PRO" badge next to the user avatar if `isPro` is true
- Grey out / disable File and Image type links for free users (currently just shows badge)

#### 3.16 Upgrade prompts

When a free user hits a limit (toast shows the error from server action), add an "Upgrade" link in the toast or a small upgrade banner. This can be done by checking `session.user.isPro` in client components.

---

## 4. Stripe Dashboard Setup Steps

1. **Create Stripe account** at dashboard.stripe.com
2. **Create Product**: "DevStash Pro"
   - Add **monthly price**: $8.00 USD, recurring monthly
   - Add **annual price**: $72.00 USD, recurring yearly
   - Copy both Price IDs into env vars
3. **Set up Customer Portal** (Settings > Billing > Customer Portal):
   - Enable subscription cancellation
   - Enable plan switching (monthly <-> annual)
   - Enable invoice history
4. **Create Webhook** (Developers > Webhooks):
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`
5. **For local development**: Use Stripe CLI
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

## 5. Testing Checklist

### Unit Tests

- [ ] `feature-gate.ts` — `canCreateItem`, `canCreateCollection`, `canUseProType`
- [ ] `createItem` action rejects when at 50 items (free user)
- [ ] `createItem` action allows when at 50 items (pro user)
- [ ] `createItem` action rejects File/Image type for free users
- [ ] `createCollection` action rejects when at 3 collections (free user)
- [ ] `createCollection` action allows when at 3 collections (pro user)

### Integration / Manual Tests

- [ ] Stripe checkout flow (monthly) — redirects to Stripe, completes payment
- [ ] Stripe checkout flow (annual) — same with annual price
- [ ] Webhook: `checkout.session.completed` sets `isPro = true`
- [ ] Webhook: `customer.subscription.deleted` sets `isPro = false`
- [ ] Session reflects `isPro` after page reload post-webhook
- [ ] Customer portal opens and allows cancellation
- [ ] Already-pro user cannot re-checkout
- [ ] Free user sees upgrade buttons on Settings page
- [ ] Pro user sees "PRO" badge and manage button on Settings page
- [ ] Free user hitting item limit sees upgrade error
- [ ] Free user hitting collection limit sees upgrade error
- [ ] File/Image creation blocked for free users
- [ ] Stripe CLI local webhook forwarding works

### Edge Cases

- [ ] User with no email (OAuth-only) — Stripe customer created without email
- [ ] Duplicate webhook delivery — idempotent (update is safe to re-run)
- [ ] Webhook arrives before redirect — user reloads and session picks up `isPro`
- [ ] Subscription lapses (card declined) — `subscription.updated` with status != active

---

## 6. Implementation Order

| Step | Task                                    | Files                                                      | Estimated Scope |
|------|-----------------------------------------|-------------------------------------------------------------|-----------------|
| 1    | Install `stripe` package                | `package.json`                                              | Tiny            |
| 2    | Create Stripe client + plan config      | `src/lib/stripe.ts`, `.env`                                 | Small           |
| 3    | Add `isPro` to JWT/session              | `src/auth.ts`, `src/types/next-auth.d.ts`                   | Small           |
| 4    | Checkout API route                      | `src/app/api/stripe/checkout/route.ts`                      | Medium          |
| 5    | Portal API route                        | `src/app/api/stripe/portal/route.ts`                        | Small           |
| 6    | Webhook handler                         | `src/app/api/stripe/webhook/route.ts`                       | Medium          |
| 7    | Feature gate utilities                  | `src/lib/feature-gate.ts`                                   | Small           |
| 8    | Gate `createItem` action                | `src/actions/items.ts`                                      | Small           |
| 9    | Gate `createCollection` action          | `src/actions/collections.ts`                                | Small           |
| 10   | Billing UI on Settings                  | `src/components/account/billing-section.tsx`, settings page  | Medium          |
| 11   | Profile DB includes billing fields      | `src/lib/db/profile.ts`                                     | Tiny            |
| 12   | Pro badge / upgrade prompts in UI       | Sidebar, dialogs, toasts                                    | Small           |
| 13   | Unit tests                              | `*.test.ts` files                                           | Medium          |
| 14   | Stripe Dashboard setup                  | External                                                    | N/A             |
| 15   | End-to-end testing with Stripe CLI      | Manual                                                      | N/A             |

---

## 7. Files Summary

### New Files

| File                                       | Purpose                              |
|--------------------------------------------|--------------------------------------|
| `src/lib/stripe.ts`                        | Stripe client + plan configuration   |
| `src/lib/feature-gate.ts`                  | Centralized free/pro limit checks    |
| `src/app/api/stripe/checkout/route.ts`     | Creates Stripe Checkout session      |
| `src/app/api/stripe/portal/route.ts`       | Opens Stripe Customer Portal         |
| `src/app/api/stripe/webhook/route.ts`      | Handles Stripe webhook events        |
| `src/components/account/billing-section.tsx`| Billing UI for Settings page         |

### Modified Files

| File                              | Change                                              |
|-----------------------------------|------------------------------------------------------|
| `src/auth.ts`                     | Sync `isPro` from DB in JWT callback                 |
| `src/types/next-auth.d.ts`        | Add `isPro` to Session and JWT types                 |
| `src/actions/items.ts`            | Add item count + pro-type checks before create       |
| `src/actions/collections.ts`      | Add collection count check before create             |
| `src/app/settings/page.tsx`       | Add Billing section                                  |
| `src/lib/db/profile.ts`          | Include `isPro`, `stripeCustomerId` in profile query |
| `src/components/dashboard/sidebar-content.tsx` | Pro badge on user, disable pro types for free |
| `.env`                            | Add 6 Stripe env vars                                |

### No Schema Migration Required

All necessary DB columns (`isPro`, `stripeCustomerId`, `stripeSubscriptionId`) already exist in the Prisma schema.

---

## 8. Key Architecture Decisions

1. **Server-side feature gating** — Limits enforced in server actions, not just UI. Free users cannot bypass limits via API.

2. **`isPro` synced on every JWT validation** — One small DB query per session check ensures the session is always in sync after webhook updates. A simple page reload after checkout picks up Pro status immediately.

3. **Stripe Checkout (not embedded)** — Uses Stripe-hosted checkout page. Simpler, PCI-compliant, handles all payment UI. No need for `@stripe/react-stripe-js` or Elements.

4. **Stripe Customer Portal for management** — Cancellation, plan switching, and invoice history handled by Stripe's portal. No custom billing management UI needed.

5. **Webhook-driven state** — `isPro` and `stripeSubscriptionId` updated only via webhooks, not checkout redirect. This is the reliable pattern since the webhook fires regardless of whether the user returns to the app.

6. **Idempotent webhook handling** — `prisma.user.update()` with the same data is safe to re-run. No need for event deduplication.

7. **No Prisma migration needed** — The `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` fields already exist in the schema.
