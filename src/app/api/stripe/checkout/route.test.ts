import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";

// ── Hoisted mocks ───────────────────────────────────────────

const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutSessionsCreate } },
  }),
  getPlanPriceId: vi.fn((plan: string) => `price_${plan}`),
}));

import { POST } from "./route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type TestSession = { user?: { id?: string } } | null;
const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/stripe/checkout", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid JSON", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const req = new Request("http://localhost/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON" });
  });

  it("returns 400 for invalid plan", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(makeRequest({ plan: "weekly" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid plan" });
  });

  it("returns 404 when user not found in DB", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "User not found" });
  });

  it("returns 400 when user is already Pro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      isPro: true,
      stripeCustomerId: null,
    } as never);
    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "User is already Pro" });
  });

  it("creates a Stripe customer when none exists", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      isPro: false,
      stripeCustomerId: null,
    } as never);
    mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "test@test.com",
      name: "Test",
      metadata: { userId: "user-1" },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_new" },
    });
  });

  it("reuses existing Stripe customer ID", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      isPro: false,
      stripeCustomerId: "cus_existing",
    } as never);
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const res = await POST(makeRequest({ plan: "annual" }));
    expect(res.status).toBe(200);

    expect(mockCustomersCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns checkout session URL on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      isPro: false,
      stripeCustomerId: "cus_123",
    } as never);
    mockCheckoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pay" });

    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/pay" });
  });

  it("returns 500 when checkout session has no URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      isPro: false,
      stripeCustomerId: "cus_123",
    } as never);
    mockCheckoutSessionsCreate.mockResolvedValue({ url: null });

    const res = await POST(makeRequest({ plan: "monthly" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to create checkout session" });
  });
});
