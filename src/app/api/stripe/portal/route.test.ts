import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";

const mockPortalSessionsCreate = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    billingPortal: { sessions: { create: mockPortalSessionsCreate } },
  }),
}));

import { POST } from "./route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type TestSession = { user?: { id?: string } } | null;
const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockFindUnique = vi.mocked(prisma.user.findUnique);

function makeRequest(): Request {
  return new Request("http://localhost/api/stripe/portal", {
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/stripe/portal", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when user has no billing account", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({ stripeCustomerId: null } as never);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No billing account found" });
  });

  it("returns 400 when user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No billing account found" });
  });

  it("returns portal URL on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({ stripeCustomerId: "cus_123" } as never);
    mockPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/portal" });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://billing.stripe.com/portal" });
  });

  it("creates portal session with correct customer and return URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({ stripeCustomerId: "cus_456" } as never);
    mockPortalSessionsCreate.mockResolvedValue({ url: "https://billing.stripe.com/portal" });

    await POST(makeRequest());

    expect(mockPortalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_456",
      return_url: "http://localhost/settings",
    });
  });
});
