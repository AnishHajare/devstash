import { describe, expect, it } from "vitest";
import {
  filterGlobalSearchData,
  fuzzyScore,
  toSearchableCollections,
} from "@/lib/global-search";
import type { CollectionWithMeta } from "@/lib/db/collections";
import type { GlobalSearchData } from "@/lib/global-search";

const searchData: GlobalSearchData = {
  items: [
    {
      id: "item-1",
      title: "React suspense snippet",
      type: { name: "Snippet", icon: "Code", color: "#3b82f6" },
      preview: "Streaming boundaries",
    },
    {
      id: "item-2",
      title: "Deploy command",
      type: { name: "Command", icon: "Terminal", color: "#f97316" },
      preview: "vercel deploy --prod",
    },
  ],
  collections: [
    {
      id: "col-1",
      name: "React Patterns",
      itemCount: 4,
      dominantType: { name: "Snippet", icon: "Code", color: "#3b82f6" },
    },
    {
      id: "col-2",
      name: "Terminal Commands",
      itemCount: 2,
      dominantType: { name: "Command", icon: "Terminal", color: "#f97316" },
    },
  ],
};

describe("global search helpers", () => {
  it("scores exact matches ahead of fuzzy matches", () => {
    expect(fuzzyScore("React Patterns", "react")).toBeLessThan(
      fuzzyScore("Reliable Action Toolkit", "react") ?? Infinity
    );
  });

  it("returns null when a fuzzy query cannot match", () => {
    expect(fuzzyScore("Deploy command", "xyz")).toBeNull();
  });

  it("filters items by title, type, and preview text", () => {
    const byPreview = filterGlobalSearchData(searchData, "vercel");
    expect(byPreview.items.map((item) => item.id)).toEqual(["item-2"]);

    const byType = filterGlobalSearchData(searchData, "snippet");
    expect(byType.items.map((item) => item.id)).toEqual(["item-1"]);
  });

  it("filters grouped collection results and limits each group", () => {
    const result = filterGlobalSearchData(searchData, "cmd", 1);
    expect(result.items.map((item) => item.id)).toEqual(["item-2"]);
    expect(result.collections.map((collection) => collection.id)).toEqual(["col-2"]);
  });

  it("maps existing collection metadata into the search payload", () => {
    const collections = [
      {
        id: "col-1",
        name: "React Patterns",
        description: null,
        isFavorite: false,
        itemCount: 3,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        types: [
          { name: "Command", icon: "Terminal", color: "#f97316", count: 3 },
          { name: "Snippet", icon: "Code", color: "#3b82f6", count: 1 },
        ],
      },
    ] satisfies CollectionWithMeta[];

    expect(toSearchableCollections(collections)).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        itemCount: 3,
        dominantType: { name: "Command", icon: "Terminal", color: "#f97316" },
      },
    ]);
  });

  it("keeps collections without item types neutral", () => {
    const collections = [
      {
        id: "col-1",
        name: "Empty",
        description: null,
        isFavorite: false,
        itemCount: 0,
        createdAt: new Date("2026-04-21T10:00:00.000Z"),
        updatedAt: new Date("2026-04-22T10:00:00.000Z"),
        types: [],
      },
    ] satisfies CollectionWithMeta[];

    expect(toSearchableCollections(collections)[0].dominantType).toBeNull();
  });
});
