import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import {
  explainCode,
  generateAutoTags,
  generateDescription,
  optimizePrompt,
} from "./ai";

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

  it("returns an invalid input error for malformed payloads without burning rate-limit quota", async () => {
    const result = await generateAutoTags({
      title: 123,
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid input",
    });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
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

describe("generateDescription", () => {
  it("returns an auth error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await generateDescription({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("returns an invalid input error for malformed payloads without burning rate-limit quota", async () => {
    const result = await generateDescription({
      title: "Valid title",
      tags: "react",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid input",
    });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns an upgrade error for free users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } } as never);
    mockCanUseAI.mockReturnValue(false);

    const result = await generateDescription({
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

    const result = await generateDescription({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please wait and try again.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("requires at least one meaningful field before calling OpenAI", async () => {
    const result = await generateDescription({
      typeName: "snippet",
      title: "   ",
      content: "",
      url: "",
      language: "",
      fileName: "",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Add a title, content, URL, language, filename, or tags first.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("parses object-shaped responses correctly", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"description":"A React Query snippet for invalidating cached queries after mutations."}',
    });

    const result = await generateDescription({
      typeName: "snippet",
      title: "Invalidate query cache",
      content: "queryClient.invalidateQueries({ queryKey: ['todos'] })",
      language: "typescript",
      tags: ["react-query", "cache"],
    });

    expect(result).toEqual({
      success: true,
      data: {
        description:
          "A React Query snippet for invalidating cached queries after mutations.",
      },
    });
  });

  it("parses string-shaped responses correctly", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text:
        '"A prompt template for structured code reviews with clear findings and follow-up questions."',
    });

    const result = await generateDescription({
      typeName: "prompt",
      title: "Code review prompt",
      content: "Review this PR and focus on bugs, regressions, and tests.",
    });

    expect(result).toEqual({
      success: true,
      data: {
        description:
          "A prompt template for structured code reviews with clear findings and follow-up questions.",
      },
    });
  });

  it("truncates content to 2000 characters before calling OpenAI", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"description":"A long-form note about performance profiling techniques."}',
    });

    await generateDescription({
      typeName: "note",
      title: "Profiling note",
      content: "a".repeat(2500),
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

  it("includes live metadata fields in the prompt", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"description":"A shell command reference for syncing a feature branch with the latest main branch."}',
    });

    await generateDescription({
      typeName: "command",
      title: "Sync branch",
      content: "git fetch origin && git rebase origin/main",
      url: "https://git-scm.com/docs/git-rebase",
      language: "shell",
      fileName: "branch-sync.sh",
      tags: ["git", "workflow"],
    });

    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Type: command"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Language: shell"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("URL: https://git-scm.com/docs/git-rebase"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Filename: branch-sync.sh"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Tags: git, workflow"),
      })
    );
  });

  it("maps empty model output to a stable generation error", async () => {
    mockCreateResponse.mockResolvedValue({
      output_text: '{"description":""}',
    });

    const result = await generateDescription({
      title: "React query cache",
      content: "How to invalidate queries",
    });

    expect(result).toEqual({
      success: false,
      error: "Could not generate a description. Try adding more detail.",
    });
  });

  it("maps OpenAI failures to a stable service error", async () => {
    mockCreateResponse.mockRejectedValue(new Error("network"));

    const result = await generateDescription({
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

describe("explainCode", () => {
  it("returns an auth error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("returns an invalid input error for malformed payloads without burning rate-limit quota", async () => {
    const result = await explainCode({ itemId: "" });

    expect(result).toEqual({
      success: false,
      error: "Invalid input",
    });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns an upgrade error for free users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } } as never);
    mockCanUseAI.mockReturnValue(false);

    const result = await explainCode({ itemId: "item-123" });

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

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please wait and try again.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns item not found when an owned item cannot be loaded", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await explainCode({ itemId: "item-123" });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "item-123", userId: "user-1" },
      select: {
        title: true,
        content: true,
        language: true,
        itemType: { select: { name: true } },
      },
    });
    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("rejects unsupported item types", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Prompt helper",
      content: "Review this code",
      language: "text",
      itemType: { name: "prompt" },
    } as never);

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: false,
      error: "Explanation is only available for snippets and commands.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("requires content before calling OpenAI", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Empty snippet",
      content: "   ",
      language: "typescript",
      itemType: { name: "snippet" },
    } as never);

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: false,
      error: "Add some code or command content first.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("parses object-shaped responses correctly", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Invalidate query cache",
      content: "queryClient.invalidateQueries({ queryKey: ['todos'] })",
      language: "typescript",
      itemType: { name: "snippet" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"explanation":"This React Query call marks the `todos` query as stale so the next read refetches fresh data."}',
    });

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: true,
      data: {
        explanation:
          "This React Query call marks the `todos` query as stale so the next read refetches fresh data.",
      },
    });
  });

  it("parses string-shaped responses correctly", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Rebase main",
      content: "git fetch origin && git rebase origin/main",
      language: "shell",
      itemType: { name: "command" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '"This command fetches the latest remote refs and then reapplies your current branch commits on top of `origin/main`."',
    });

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: true,
      data: {
        explanation:
          "This command fetches the latest remote refs and then reapplies your current branch commits on top of `origin/main`.",
      },
    });
  });

  it("truncates content to 2000 characters before calling OpenAI", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Long snippet",
      content: "a".repeat(2500),
      language: "typescript",
      itemType: { name: "snippet" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"explanation":"A code snippet with enough detail to explain the main flow and key concepts."}',
    });

    await explainCode({ itemId: "item-123" });

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

  it("includes item metadata in the prompt", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Rebase main",
      content: "git fetch origin && git rebase origin/main",
      language: "shell",
      itemType: { name: "command" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"explanation":"A Git workflow command for syncing your current branch with the latest main branch history."}',
    });

    await explainCode({ itemId: "item-123" });

    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Type: command"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Title: Rebase main"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Language: shell"),
      })
    );
  });

  it("maps empty model output to a stable generation error", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Rebase main",
      content: "git fetch origin && git rebase origin/main",
      language: "shell",
      itemType: { name: "command" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text: '{"explanation":""}',
    });

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: false,
      error: "Could not generate an explanation. Try again.",
    });
  });

  it("maps OpenAI failures to a stable service error", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Rebase main",
      content: "git fetch origin && git rebase origin/main",
      language: "shell",
      itemType: { name: "command" },
    } as never);
    mockCreateResponse.mockRejectedValue(new Error("network"));

    const result = await explainCode({ itemId: "item-123" });

    expect(result).toEqual({
      success: false,
      error: "AI service is unavailable. Try again.",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe("optimizePrompt", () => {
  it("returns an auth error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Draft prompt",
    });

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  it("returns an invalid input error for malformed payloads without burning rate-limit quota", async () => {
    const result = await optimizePrompt({ itemId: "", content: "Draft prompt" });

    expect(result).toEqual({
      success: false,
      error: "Invalid input",
    });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns an upgrade error for free users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } } as never);
    mockCanUseAI.mockReturnValue(false);

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Draft prompt",
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

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Draft prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please wait and try again.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("returns item not found when an owned item cannot be loaded", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Draft prompt",
    });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "item-123", userId: "user-1" },
      select: {
        title: true,
        itemType: { select: { name: true } },
      },
    });
    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("rejects unsupported item types", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Snippet helper",
      itemType: { name: "snippet" },
    } as never);

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Draft prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Optimization is only available for prompts.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("requires content before calling OpenAI", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Prompt helper",
      itemType: { name: "prompt" },
    } as never);

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: "Add some prompt content first.",
    });
    expect(mockCreateResponse).not.toHaveBeenCalled();
  });

  it("parses object-shaped responses correctly", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Code review prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"optimizedPrompt":"Review the following pull request diff. Summarize the changes, identify risks, and list concrete follow-up questions."}',
    });

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Review this PR",
    });

    expect(result).toEqual({
      success: true,
      data: {
        optimizedPrompt:
          "Review the following pull request diff. Summarize the changes, identify risks, and list concrete follow-up questions.",
      },
    });
  });

  it("parses string-shaped responses correctly", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Bug triage prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '"Triage the following bug report. Extract the root problem, likely impact, missing details, and the next debugging steps."',
    });

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Help me triage this bug",
    });

    expect(result).toEqual({
      success: true,
      data: {
        optimizedPrompt:
          "Triage the following bug report. Extract the root problem, likely impact, missing details, and the next debugging steps.",
      },
    });
  });

  it("truncates content to 2000 characters before calling OpenAI", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Long prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"optimizedPrompt":"A tighter, clearer version of the original prompt."}',
    });

    await optimizePrompt({
      itemId: "item-123",
      content: "a".repeat(2500),
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

  it("includes item metadata and live content in the prompt", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Code review prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text:
        '{"optimizedPrompt":"Review the provided code changes and call out correctness, maintainability, and testing gaps."}',
    });

    await optimizePrompt({
      itemId: "item-123",
      content: "Look at this patch and tell me if it is okay",
    });

    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Item type: prompt"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining("Title: Code review prompt"),
      })
    );
    expect(mockCreateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.stringContaining(
          "Look at this patch and tell me if it is okay"
        ),
      })
    );
  });

  it("maps empty model output to a stable generation error", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Code review prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockResolvedValue({
      output_text: '{"optimizedPrompt":""}',
    });

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Review this PR",
    });

    expect(result).toEqual({
      success: false,
      error: "Could not optimize the prompt. Try again.",
    });
  });

  it("maps OpenAI failures to a stable service error", async () => {
    mockFindFirst.mockResolvedValue({
      title: "Code review prompt",
      itemType: { name: "prompt" },
    } as never);
    mockCreateResponse.mockRejectedValue(new Error("network"));

    const result = await optimizePrompt({
      itemId: "item-123",
      content: "Review this PR",
    });

    expect(result).toEqual({
      success: false,
      error: "AI service is unavailable. Try again.",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
