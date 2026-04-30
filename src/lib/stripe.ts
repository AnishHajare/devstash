import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getRequiredEnv(name: string, fallbackName?: string): string {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);

  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }

  return value;
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY", "STRIPLE_SECRET_KEY"), {
      typescript: true,
    });
  }

  return stripeClient;
}

export const PLANS = {
  monthly: {
    priceId:
      process.env.STRIPE_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
    price: 8,
    interval: "month" as const,
  },
  annual: {
    priceId:
      process.env.STRIPE_ANNUAL_PRICE_ID ?? process.env.STRIPE_PRICE_ID_YEARLY ?? "",
    price: 72,
    interval: "year" as const,
  },
} as const;

export type PlanInterval = keyof typeof PLANS;

export function getPlanPriceId(plan: PlanInterval): string {
  const priceId = PLANS[plan].priceId;

  if (!priceId) {
    throw new Error(`Stripe price ID for ${plan} plan is not set`);
  }

  return priceId;
}
