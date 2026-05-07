import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { generateAutoTags } from "./ai";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/feature-gate", () => ({
  canUseAI: vi.fn((isPro: boolean) => isPro),
}));

vi.mock("@/lib/rate-limit", () => ({
  aiActionLimiter: { name: "ai" },
  checkRateLimit: vi.fn(),
  rateLimitKey: vi.fn((prefix: string, userId: string) => `${prefix}:${userId}`),
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano-2025-08-07",
  getOpenAI: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { canUseAI } from "@/lib/feature-gate";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOpenAI } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

type TestSession = { user?: { id?: string; isPro?: boolean } } | null;

const mockAuth = auth as unknown as MockedFunction<() => Promise<TestSession>>;
const mockCanUseAI = vi.mocked(canUseAI);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockGetOpenAI = vi.mocked(getOpenAI);
const mockFindFirst = vi.mocked(prisma.item.findFirst);
const mockCreateResponse = vi.fn();
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } } as never);
  mockCanUseAI.mockReturnValue(true);
  mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  mockGetOpenAI.mockReturnValue({
    responses: {
      create: mockCreateResponse,
    },
  } as never);
});

describe("generateAutoTags", () => {
  it("returns an auth error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await generateAutoTags({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("returns an invalid input error for malformed payloads", async () => {
    const result = await generateAutoTags({
      title: 123,
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid input",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns an upgrade error for free users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } } as never);
    mockCanUseAI.mockReturnValue(false);

    const result = await generateAutoTags({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI features.",
    });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("maps rate limiting to a friendly error", async () => {
    mockCheckRateLimit.mockResolvedValue(
      Response.json({ error: "Too many requests" }, { status: 429 })
    );

    const result = await generateAutoTags({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please wait and try again.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("requires a title or content before calling OpenAI", async () => {
    const result = await generateAutoTags({
      title: "   ",
      content: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Add a title or some content first.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns item not found when an owned item cannot be loaded", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await generateAutoTags({
      itemId: "item-123",
      title: "Draft title",
      content: "Draft content",
    });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "item-123", userId: "user-1" },
      select: {
        title: true,
        content: true,
        itemType: { select: { name: true } },
      },
    });
    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("uses the owned item type when itemId is provided without a type name", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Stored title",
      content: "Stored content",
      itemType: { name: "command" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text: '{"tags":["CLI","Debugging","Logs"]}',
    });

    const result = await generateAutoTags({
      itemId: "item-123",
      title: "Edited title",
      content: "Edited content",
    });

    expect(result).toEqual({
      success: true,
      data: { tags: ["cli", "debugging", "logs"] },
    });
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Type: command"),
      })
    );
  });

  it("parses object-shaped responses correctly", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text: '{"tags":["React","Hooks","Caching"]}',
    });

    const result = await generateAutoTags({
      title: "React query cache",
      content: "How to invalidate queries",
      typeName: "snippet",
    });

    expect(result).toEqual({
      success: true,
      data: { tags: ["react", "hooks", "caching"] },
    });
  });

  it("parses array-shaped responses correctly", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text: '["TypeScript","Vitest","Unit Testing"]',
    });

    const result = await generateAutoTags({
      title: "Testing helpers",
      content: "Vitest mocks and assertions",
      typeName: "note",
    });

    expect(result).toEqual({
      success: true,
      data: { tags: ["typescript", "vitest", "unit testing"] },
    });
  });

  it("normalizes tags to lowercase and removes duplicates", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text: '{"tags":["React","react","REACT Hooks","react hooks","Debugging"]}',
    });

    const result = await generateAutoTags({
      title: "React debugging",
      content: "Tracing render loops",
    });

    expect(result).toEqual({
      success: true,
      data: { tags: ["react", "react hooks", "debugging"] },
    });
  });

  it("truncates content to 2000 characters before calling OpenAI", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text: '{"tags":["performance","profiling","nextjs"]}',
    });

    await generateAutoTags({
      title: "Long note",
      content: "a".repeat(2500),
      typeName: "note",
    });

    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("a".repeat(2000)),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.not.stringContaining("a".repeat(2001)),
      })
    );
  });

  it("maps OpenAI failures to a stable service error", async () => {
    mockCreateResponse.mockRejectedValue(new Error("network"));

    const result = await generateAutoTags({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "AI service is unavailable. Try again.",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
