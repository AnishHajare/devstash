import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUniqueOrThrow, itemCount, collectionCount, itemTypeFindMany } =
  vi.hoisted(() => ({
    userFindUniqueOrThrow: vi.fn(),
    itemCount: vi.fn(),
    collectionCount: vi.fn(),
    itemTypeFindMany: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUniqueOrThrow: userFindUniqueOrThrow },
    item: { count: itemCount },
    collection: { count: collectionCount },
    itemType: { findMany: itemTypeFindMany },
  },
}));

import { getUserProfile } from "@/lib/db/profile";

const BASE_USER = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  image: null,
  isPro: false,
  stripeCustomerId: null,
  password: "hashed-pw",
  createdAt: new Date("2025-01-15T00:00:00Z"),
};

describe("getUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    itemCount.mockResolvedValue(10);
    collectionCount.mockResolvedValue(3);
    itemTypeFindMany.mockResolvedValue([]);
  });

  it("returns user profile with hasPassword true when password exists", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ ...BASE_USER, password: "pw" });

    const { user } = await getUserProfile("user-1");

    expect(user.hasPassword).toBe(true);
    expect(user.id).toBe("user-1");
    expect(user.email).toBe("alice@example.com");
    expect(user.isPro).toBe(false);
    expect(user.stripeCustomerId).toBeNull();
    expect(user.createdAt).toBe("2025-01-15T00:00:00.000Z");
  });

  it("returns billing fields when present", async () => {
    userFindUniqueOrThrow.mockResolvedValue({
      ...BASE_USER,
      isPro: true,
      stripeCustomerId: "cus_123",
    });

    const { user } = await getUserProfile("user-1");

    expect(user.isPro).toBe(true);
    expect(user.stripeCustomerId).toBe("cus_123");
  });

  it("returns hasPassword false when password is null", async () => {
    userFindUniqueOrThrow.mockResolvedValue({ ...BASE_USER, password: null });

    const { user } = await getUserProfile("user-1");

    expect(user.hasPassword).toBe(false);
  });

  it("returns correct aggregate stats", async () => {
    userFindUniqueOrThrow.mockResolvedValue(BASE_USER);
    itemCount.mockResolvedValue(42);
    collectionCount.mockResolvedValue(7);

    const { stats } = await getUserProfile("user-1");

    expect(stats.totalItems).toBe(42);
    expect(stats.totalCollections).toBe(7);
  });

  it("sorts itemsByType by count descending", async () => {
    userFindUniqueOrThrow.mockResolvedValue(BASE_USER);
    itemTypeFindMany.mockResolvedValue([
      { name: "snippet", icon: "Code", color: "#3b82f6", _count: { items: 5 } },
      { name: "prompt", icon: "Sparkles", color: "#8b5cf6", _count: { items: 20 } },
      { name: "command", icon: "Terminal", color: "#f97316", _count: { items: 1 } },
    ]);

    const { stats } = await getUserProfile("user-1");

    expect(stats.itemsByType.map((t) => t.name)).toEqual([
      "prompt",
      "snippet",
      "command",
    ]);
    expect(stats.itemsByType[0].count).toBe(20);
  });

  it("returns empty itemsByType when no types have items", async () => {
    userFindUniqueOrThrow.mockResolvedValue(BASE_USER);
    itemTypeFindMany.mockResolvedValue([]);

    const { stats } = await getUserProfile("user-1");

    expect(stats.itemsByType).toEqual([]);
  });
});
