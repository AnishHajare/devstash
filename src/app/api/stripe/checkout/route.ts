import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanPriceId, getStripe } from "@/lib/stripe";
import { z } from "zod";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

function getBaseUrl(request: Request): string {
  return process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      isPro: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (user.isPro) {
    return Response.json({ error: "User is already Pro" }, { status: 400 });
  }

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });

    customerId = customer.id;

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = getBaseUrl(request);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: getPlanPriceId(parsed.data.plan),
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/settings?upgraded=true`,
    cancel_url: `${baseUrl}/settings`,
    metadata: {
      userId: user.id,
      plan: parsed.data.plan,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
  });

  if (!checkoutSession.url) {
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  return Response.json({ url: checkoutSession.url });
}
