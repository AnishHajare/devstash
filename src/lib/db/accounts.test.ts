import { beforeEach, describe, expect, it, vi } from "vitest";

const { userFindUniqueOrThrow, accountFindMany, accountDeleteMany } =
  vi.hoisted(() => ({
    userFindUniqueOrThrow: vi.fn(),
    accountFindMany: vi.fn(),
    accountDeleteMany: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: userFindUniqueOrThrow,
    },
    account: {
      findMany: accountFindMany,
      deleteMany: accountDeleteMany,
    },
  },
}));

import { getLinkedAccounts, unlinkAccount } from "@/lib/db/accounts";

describe("accounts db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLinkedAccounts", () => {
    it("returns oauth accounts for the user", async () => {
      accountFindMany.mockResolvedValue([
        { provider: "github", providerAccountId: "gh-123" },
      ]);

      const result = await getLinkedAccounts("user-1");

      expect(accountFindMany).toHaveBeenCalledWith({
        where: { userId: "user-1", type: "oauth" },
        select: { provider: true, providerAccountId: true },
      });
      expect(result).toEqual([
        { provider: "github", providerAccountId: "gh-123" },
      ]);
    });

    it("returns empty array when no linked accounts", async () => {
      accountFindMany.mockResolvedValue([]);

      const result = await getLinkedAccounts("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("unlinkAccount", () => {
    it("unlinks the provider when user has a password", async () => {
      userFindUniqueOrThrow.mockResolvedValue({ password: "hashed-pw" });
      accountDeleteMany.mockResolvedValue({ count: 1 });

      await unlinkAccount("user-1", "github");

      expect(accountDeleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", provider: "github" },
      });
    });

    it("throws when user has no password (only sign-in method)", async () => {
      userFindUniqueOrThrow.mockResolvedValue({ password: null });

      await expect(unlinkAccount("user-1", "github")).rejects.toThrow(
        "Cannot unlink your only sign-in method"
      );

      expect(accountDeleteMany).not.toHaveBeenCalled();
    });

    it("throws when user has empty string password", async () => {
      userFindUniqueOrThrow.mockResolvedValue({ password: "" });

      await expect(unlinkAccount("user-1", "google")).rejects.toThrow(
        "Cannot unlink your only sign-in method"
      );
    });
  });
});
