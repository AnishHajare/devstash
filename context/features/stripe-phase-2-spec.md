# Stripe Integration Phase 2 — Webhooks, Feature Gating & UI Spec

## Overview

Wire up the Stripe webhook handler, enforce free-tier limits in server actions, build the billing UI on the settings page, and add Pro badges and upgrade prompts throughout the app. This phase requires the Stripe CLI for local webhook testing.

---

## Prerequisites

- Phase 1 complete (Stripe client, feature-gate utility, checkout/portal routes, `isPro` in session)
- Stripe Dashboard configured: product created, monthly ($8) and annual ($72) prices, customer portal enabled, webhook endpoint registered
- Stripe CLI installed for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## Implementation Steps

### Step 1: Webhook Handler

**New file: `src/app/api/stripe/webhook/route.ts`**

- `POST` handler — **no auth middleware** (Stripe sends server-to-server)
- Reads raw body with `req.text()` (not `req.json()`) for signature verification
- Verifies signature using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- Returns 400 on missing/invalid signature

**Handled events:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Retrieve subscription from session, read `metadata.userId`, set `isPro = true` and `stripeSubscriptionId` |
| `customer.subscription.updated` | Read `metadata.userId`, check `subscription.status` — set `isPro = true` if active/trialing, `false` otherwise |
| `customer.subscription.deleted` | Read `metadata.userId`, set `isPro = false`, clear `stripeSubscriptionId` |

All handlers are idempotent — `prisma.user.update()` with the same values is safe to re-run.

Returns `{ received: true }` for all events (including unhandled ones).

---

### Step 2: Gate `createItem` Server Action

**Modify: `src/actions/items.ts`**

After the auth check in `createItem`, add two guards:

1. **Pro-type check**: If the item type is in `PRO_SYSTEM_TYPES` (File, Image) and user is not Pro, return `{ success: false, error: "File and Image types require DevStash Pro" }`
2. **Item limit check**: Call `canCreateItem(userId, isPro)`. If false, return `{ success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." }`

Import `canCreateItem`, `canUseProType` from `@/lib/feature-gate` and `PRO_SYSTEM_TYPES` from `@/lib/item-type-constants`.

---

### Step 3: Gate `createCollection` Server Action

**Modify: `src/actions/collections.ts`**

After the auth check in `createCollection`, add:

- Call `canCreateCollection(userId, isPro)`. If false, return `{ success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited collections." }`

---

### Step 4: Billing UI on Settings Page

**New file: `src/components/account/billing-section.tsx`**

Client component (`"use client"`) receiving `isPro` and `hasStripeCustomer` props:

**Pro user view:**
- Emerald "PRO" badge + "You have full access to all DevStash features." text
- "Manage Subscription" outline button (calls `/api/stripe/portal`, redirects to Stripe portal)
- Button only shown if `hasStripeCustomer` is true

**Free user view:**
- Text explaining current plan and what Pro unlocks
- Two buttons:
  - "Upgrade -- $8/mo" (primary) — calls `/api/stripe/checkout` with `plan: "monthly"`
  - "Upgrade -- $72/yr (save 25%)" (outline) — calls `/api/stripe/checkout` with `plan: "annual"`
- Both buttons redirect to Stripe Checkout URL on success, show toast on error
- Loading state disables buttons and shows "Loading..."/"Opening..."

**Modify: `src/app/settings/page.tsx`**

Add a "Billing" section with `<BillingSection>` between Account and Appearance sections. Wrap in Card/CardHeader/CardContent matching existing settings sections. Pass `isPro` and `hasStripeCustomer` (from `!!user.stripeCustomerId`) as props.

---

### Step 5: Pro Badge & Upgrade Prompts

**Modify: `src/components/dashboard/sidebar-content.tsx`**

- Show a "PRO" badge next to the user avatar/name area when `session.user.isPro` is true
- Keep existing PRO badges on File/Image types
- For free users, grey out / reduce opacity on File and Image type links (they already show PRO badge)

**Upgrade prompts in error toasts:**

When `createItem` or `createCollection` returns a limit error, the existing toast already shows the error message. Optionally add an "Upgrade" action link in the toast pointing to `/settings`.

---

## Testing

### Local Webhook Testing (Stripe CLI)

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Stripe CLI forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Monthly checkout | Free user clicks "Upgrade -- $8/mo" on settings | Redirects to Stripe Checkout, completes with test card `4242...`, webhook fires, `isPro` becomes true |
| Annual checkout | Free user clicks "Upgrade -- $72/yr" on settings | Same flow with annual price |
| Session reflects Pro | After checkout, reload any page | `session.user.isPro` is `true`, PRO badge visible |
| Already-pro block | Pro user tries checkout again | Returns "Already subscribed" error |
| Customer portal | Pro user clicks "Manage Subscription" | Redirects to Stripe portal, can cancel/switch plan |
| Subscription cancelled | Cancel via portal, webhook fires | `isPro` becomes `false`, subscription cleared |
| Subscription updated (lapsed) | Simulate card decline via Stripe dashboard | `subscription.updated` with inactive status sets `isPro = false` |
| Item limit (free) | Free user with 50 items tries to create item | Error: "Free plan limit reached (50 items)..." |
| Item limit (pro) | Pro user with 50+ items creates item | Succeeds |
| Collection limit (free) | Free user with 3 collections tries to create | Error: "Free plan limit reached (3 collections)..." |
| Collection limit (pro) | Pro user with 3+ collections creates | Succeeds |
| Pro type blocked (free) | Free user tries to create File/Image item | Error: "File and Image types require DevStash Pro" |
| Billing UI (free) | Free user visits /settings | Sees upgrade buttons, no manage button |
| Billing UI (pro) | Pro user visits /settings | Sees PRO badge, manage subscription button |
| No email user | OAuth-only user (no email) checks out | Stripe customer created without email |
| Duplicate webhook | Same event delivered twice | Second update is idempotent, no error |

### Edge Cases

- Webhook arrives before user returns from Stripe — page reload picks up `isPro` via JWT sync
- User with `stripeCustomerId` but no active subscription — portal button visible, Pro badge not shown
- `STRIPE_WEBHOOK_SECRET` not set — webhook route returns 400

---

## Files Summary

### New Files

| File | Purpose |
|---|---|
| `src/app/api/stripe/webhook/route.ts` | Handles Stripe webhook events |
| `src/components/account/billing-section.tsx` | Billing UI for settings page |

### Modified Files

| File | Change |
|---|---|
| `src/actions/items.ts` | Add item count + pro-type limit checks in `createItem` |
| `src/actions/collections.ts` | Add collection count limit check in `createCollection` |
| `src/app/settings/page.tsx` | Add Billing section with BillingSection component |
| `src/components/dashboard/sidebar-content.tsx` | Pro badge on user area, dimmed pro types for free users |

---

## Verification

- `npm run build` passes
- `npm test` passes (existing tests + Phase 1 feature-gate tests)
- Full checkout flow works end-to-end with Stripe CLI
- Webhook events correctly update `isPro` in database
- Feature gates block free users at server action level
- Billing UI correctly reflects free vs pro state
- Settings page shows appropriate upgrade/manage controls
