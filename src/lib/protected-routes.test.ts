import { describe, expect, it } from "vitest";
import { isProtectedPath } from "./protected-routes";

describe("protected routes", () => {
  it("protects dashboard and settings paths", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/profile")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
    expect(isProtectedPath("/settings/security")).toBe(true);
    expect(isProtectedPath("/favorites")).toBe(true);
    expect(isProtectedPath("/favorites/archive")).toBe(true);
  });

  it("leaves public auth paths unprotected", () => {
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
    expect(isProtectedPath("/settings-public")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });

});
