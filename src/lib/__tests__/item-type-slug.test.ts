import { describe, it, expect } from "vitest";
import { typeNameToSlug, typeSlugToName } from "@/lib/item-type-slug";

describe("typeNameToSlug", () => {
  it("converts singular title-case name to lowercase plural slug", () => {
    expect(typeNameToSlug("Snippet")).toBe("snippets");
    expect(typeNameToSlug("Prompt")).toBe("prompts");
    expect(typeNameToSlug("Command")).toBe("commands");
    expect(typeNameToSlug("Note")).toBe("notes");
    expect(typeNameToSlug("Link")).toBe("links");
    expect(typeNameToSlug("File")).toBe("files");
    expect(typeNameToSlug("Image")).toBe("images");
  });
});

describe("typeSlugToName", () => {
  it("converts lowercase plural slug to singular title-case name", () => {
    expect(typeSlugToName("snippets")).toBe("Snippet");
    expect(typeSlugToName("prompts")).toBe("Prompt");
    expect(typeSlugToName("commands")).toBe("Command");
    expect(typeSlugToName("notes")).toBe("Note");
    expect(typeSlugToName("links")).toBe("Link");
    expect(typeSlugToName("files")).toBe("File");
    expect(typeSlugToName("images")).toBe("Image");
  });

  it("handles slugs without trailing s gracefully", () => {
    expect(typeSlugToName("snippet")).toBe("Snippet");
  });
});
