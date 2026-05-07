export function mergeTagString(existing: string, nextTag: string): string {
  const normalizedNext = nextTag.trim();
  if (!normalizedNext) {
    return existing;
  }

  const tags = existing
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.some((tag) => tag.toLowerCase() === normalizedNext.toLowerCase())) {
    return tags.join(", ");
  }

  return [...tags, normalizedNext].join(", ");
}
