/**
 * Canonical slug convention for item types.
 *
 * DB stores type names in Title case singular: "Snippet", "Prompt", etc.
 * URL slugs are lowercase plural:              "snippets", "prompts", etc.
 *
 * All conversions between these forms go through these two functions.
 * Never perform inline string manipulation on type names elsewhere.
 */

/**
 * "Snippet" → "snippets"
 * Used when generating href links.
 */
export function typeNameToSlug(name: string): string {
  return name.toLowerCase() + "s";
}

/**
 * "snippets" → "Snippet"
 * Used when reading a URL param and querying the DB.
 */
export function typeSlugToName(slug: string): string {
  const singular = slug.endsWith("s") ? slug.slice(0, -1) : slug;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}
