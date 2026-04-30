import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";

const mockUpdateMany = vi.mocked(prisma.user.updateMany);

function makeRequest(signature: string | null = "sig_123") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: signature === null ? undefined : { "stripe-signature": signature },
    body: JSON.stringify({ id: "evt_123" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
  mockUpdateMany.mockResolvedValue({ count: 1 } as never);
});

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when webhook secret is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Stripe webhook secret is not configured",
    });
  });

  it("returns 400 when signature is missing", async () => {
    const res = await POST(makeRequest(null));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing Stripe signature" });
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid Stripe signature" });
  });

  it("syncs checkout.session.completed by retrieving the subscription", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { subscription: "sub_123" } },
    });
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      customer: "cus_123",
      metadata: { userId: "user-1" },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith("sub_123");
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        isPro: true,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      },
    });
  });

  it("acknowledges checkout.session.completed when no subscription is attached", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { subscription: null } },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("sets isPro true for trialing subscriptions", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "trialing",
          customer: "cus_123",
          metadata: { userId: "user-1" },
        },
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        isPro: true,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      },
    });
  });

  it("syncs customer.subscription.updated and disables Pro for inactive status", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "past_due",
          customer: { id: "cus_123" },
          metadata: { userId: "user-1" },
        },
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        isPro: false,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      },
    });
  });

  it("clears Pro and subscription ID for customer.subscription.deleted", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          status: "canceled",
          customer: "cus_123",
          metadata: { userId: "user-1" },
        },
      },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        isPro: false,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: null,
      },
    });
  });

  it("ignores unrelated events", async () => {
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: { object: {} },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 500 when subscription sync fails", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "active",
          customer: "cus_123",
          metadata: { userId: "user-1" },
        },
      },
    });
    mockUpdateMany.mockRejectedValue(new Error("database unavailable") as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to process Stripe webhook" });
  });
});
