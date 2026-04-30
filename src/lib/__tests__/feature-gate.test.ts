import { beforeEach, describe, expect, it, vi } from "vitest";

const { itemCount, collectionCount } = vi.hoisted(() => ({
  itemCount: vi.fn(),
  collectionCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: itemCount },
    collection: { count: collectionCount },
  },
}));

import {
  canCreateCollection,
  canCreateItem,
  canUseAI,
  canUseProType,
  FREE_LIMITS,
} from "@/lib/feature-gate";

describe("feature gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows pro users to create items without counting", async () => {
    await expect(canCreateItem("user-1", true)).resolves.toBe(true);
    expect(itemCount).not.toHaveBeenCalled();
  });

  it("allows free users below the item limit", async () => {
    itemCount.mockResolvedValue(49);

    await expect(canCreateItem("user-1", false)).resolves.toBe(true);
  });

  it("blocks free users at the item limit", async () => {
    itemCount.mockResolvedValue(50);

    await expect(canCreateItem("user-1", false)).resolves.toBe(false);
  });

  it("blocks free users above the item limit", async () => {
    itemCount.mockResolvedValue(51);

    await expect(canCreateItem("user-1", false)).resolves.toBe(false);
  });

  it("allows pro users to create collections without counting", async () => {
    await expect(canCreateCollection("user-1", true)).resolves.toBe(true);
    expect(collectionCount).not.toHaveBeenCalled();
  });

  it("allows free users below the collection limit", async () => {
    collectionCount.mockResolvedValue(4);

    await expect(canCreateCollection("user-1", false)).resolves.toBe(true);
  });

  it("blocks free users at the collection limit", async () => {
    collectionCount.mockResolvedValue(5);

    await expect(canCreateCollection("user-1", false)).resolves.toBe(false);
  });

  it("allows pro-only item types for pro users", () => {
    expect(canUseProType(true)).toBe(true);
  });

  it("blocks pro-only item types for free users", () => {
    expect(canUseProType(false)).toBe(false);
  });

  it("allows AI for pro users", () => {
    expect(canUseAI(true)).toBe(true);
  });

  it("blocks AI for free users", () => {
    expect(canUseAI(false)).toBe(false);
  });

  it("sets the free item limit", () => {
    expect(FREE_LIMITS.items).toBe(50);
  });

  it("sets the free collection limit", () => {
    expect(FREE_LIMITS.collections).toBe(5);
  });
});
