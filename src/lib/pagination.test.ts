import { describe, expect, it } from "vitest";
import {
  getPaginationRange,
  getTotalPages,
  parsePageParam,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("parses valid page params and falls back to page 1", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(["4"])).toBe(4);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("calculates skip/take for a page", () => {
    expect(getPaginationRange(3, 21)).toEqual({ skip: 42, take: 21 });
  });

  it("keeps total pages at a minimum of one", () => {
    expect(getTotalPages(0, 21)).toBe(1);
    expect(getTotalPages(1, 21)).toBe(1);
    expect(getTotalPages(22, 21)).toBe(2);
  });
});
