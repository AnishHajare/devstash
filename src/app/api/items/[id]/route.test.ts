import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  getItemDetail: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      updateMany: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { getItemDetail, deleteItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockGetItemDetail = vi.mocked(getItemDetail);
const mockDeleteItem = vi.mocked(deleteItem);
const mockUpdateMany = vi.mocked(prisma.item.updateMany);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/items/test-id", {
    method: body !== undefined ? "PATCH" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET ──────────────────────────────────────────────────────

describe("GET /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams("abc"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when item not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockGetItemDetail.mockResolvedValue(null);
    const res = await GET(makeRequest(), makeParams("missing-id"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns item data on success", async () => {
    const item = { id: "item-1", title: "Test", isFavorite: false };
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockGetItemDetail.mockResolvedValue(item as never);
    const res = await GET(makeRequest(), makeParams("item-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(item);
    expect(mockGetItemDetail).toHaveBeenCalledWith("item-1", "user-1");
  });
});

// ── PATCH ────────────────────────────────────────────────────

describe("PATCH /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ isFavorite: true }), makeParams("abc"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no rows updated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const res = await PATCH(makeRequest({ isFavorite: true }), makeParams("missing"));
    expect(res.status).toBe(404);
  });

  it("updates isFavorite and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    const res = await PATCH(makeRequest({ isFavorite: true }), makeParams("item-1"));
    expect(res.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      data: { isFavorite: true },
    });
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("updates isPinned and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    const res = await PATCH(makeRequest({ isPinned: false }), makeParams("item-1"));
    expect(res.status).toBe(200);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      data: { isPinned: false },
    });
  });

  it("ignores non-boolean values for isFavorite and isPinned", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    await PATCH(makeRequest({ isFavorite: "yes", isPinned: 1 }), makeParams("item-1"));
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      data: {},
    });
  });
});

// ── DELETE ───────────────────────────────────────────────────

describe("DELETE /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), makeParams("abc"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no rows deleted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDeleteItem.mockResolvedValue(false);
    const res = await DELETE(makeRequest(), makeParams("missing"));
    expect(res.status).toBe(404);
  });

  it("deletes item scoped to user and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDeleteItem.mockResolvedValue(true);
    const res = await DELETE(makeRequest(), makeParams("item-1"));
    expect(res.status).toBe(200);
    expect(mockDeleteItem).toHaveBeenCalledWith("item-1", "user-1");
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
