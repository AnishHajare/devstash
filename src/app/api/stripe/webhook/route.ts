import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const PRO_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

class PermanentWebhookError extends Error {}

function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function isProSubscription(subscription: Stripe.Subscription): boolean {
  return PRO_SUBSCRIPTION_STATUSES.has(subscription.status);
}

async function getCheckoutSubscription(
  session: Stripe.Checkout.Session
): Promise<Stripe.Subscription | null> {
  if (!session.subscription) return null;
  if (typeof session.subscription !== "string") {
    return session.subscription;
  }

  return getStripe().subscriptions.retrieve(session.subscription);
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    throw new PermanentWebhookError("Subscription is missing metadata.userId");
  }

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      isPro: isProSubscription(subscription),
      stripeCustomerId: getCustomerId(subscription.customer),
      stripeSubscriptionId: subscription.id,
    },
  });
}

async function clearSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) {
    throw new PermanentWebhookError("Subscription is missing metadata.userId");
  }

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      isPro: false,
      stripeCustomerId: getCustomerId(subscription.customer),
      stripeSubscriptionId: null,
    },
  });
}

export async function POST(request: Request) {
  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    return Response.json({ error: "Stripe webhook secret is not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await getCheckoutSubscription(session);
        if (!subscription) {
          break;
        }
        await syncSubscription(subscription);
        break;
      }
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await clearSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    if (error instanceof PermanentWebhookError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Failed to process Stripe webhook" }, { status: 500 });
  }

  return Response.json({ received: true });
}
