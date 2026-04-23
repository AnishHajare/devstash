import { describe, expect, it } from "vitest";
import { getAuthProviderSummaries } from "./auth-provider-summary";

describe("getAuthProviderSummaries", () => {
  it("marks email password sign-in as connected when the user has a password", () => {
    expect(
      getAuthProviderSummaries({
        hasPassword: true,
        linkedProviders: [],
      })
    ).toEqual([
      {
        id: "credentials",
        label: "Email and password",
        connected: true,
      },
    ]);
  });

  it("includes linked oauth providers with readable labels", () => {
    expect(
      getAuthProviderSummaries({
        hasPassword: false,
        linkedProviders: ["github"],
      })
    ).toEqual([
      {
        id: "credentials",
        label: "Email and password",
        connected: false,
      },
      {
        id: "github",
        label: "GitHub",
        connected: true,
      },
    ]);
  });
});
