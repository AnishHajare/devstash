import type { CollectionWithMeta } from "@/lib/db/collections";
import type { SearchableItem } from "@/lib/db/items";

export type SearchableCollection = {
  id: string;
  name: string;
  itemCount: number;
  dominantType: {
    icon: string;
    color: string;
    name: string;
  } | null;
};

export type GlobalSearchData = {
  items: SearchableItem[];
  collections: SearchableCollection[];
};

export type GlobalSearchResult = {
  items: SearchableItem[];
  collections: SearchableCollection[];
};

type Scored<T> = {
  value: T;
  score: number;
};

export function toSearchableCollections(
  collections: CollectionWithMeta[]
): SearchableCollection[] {
  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemCount: collection.itemCount,
    dominantType: collection.types[0]
      ? {
          icon: collection.types[0].icon,
          color: collection.types[0].color,
          name: collection.types[0].name,
        }
      : null,
  }));
}

export function filterGlobalSearchData(
  data: GlobalSearchData,
  query: string,
  limit = 6
): GlobalSearchResult {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      items: data.items.slice(0, limit),
      collections: data.collections.slice(0, limit),
    };
  }

  return {
    items: rankMatches(data.items, normalizedQuery, itemSearchText).slice(0, limit),
    collections: rankMatches(
      data.collections,
      normalizedQuery,
      (collection) => collection.name
    ).slice(0, limit),
  };
}

function itemSearchText(item: SearchableItem): string {
  return [item.title, item.type.name, item.preview].filter(Boolean).join(" ");
}

function rankMatches<T>(
  values: T[],
  query: string,
  getText: (value: T) => string
): T[] {
  return values
    .map((value): Scored<T> | null => {
      const score = fuzzyScore(getText(value), query);
      return score === null ? null : { value, score };
    })
    .filter((match): match is Scored<T> => match !== null)
    .sort((a, b) => a.score - b.score)
    .map((match) => match.value);
}

export function fuzzyScore(text: string, query: string): number | null {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();

  if (!needle) return 0;

  const exactIndex = haystack.indexOf(needle);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  let score = 0;
  let searchFrom = 0;

  for (const char of needle) {
    const index = haystack.indexOf(char, searchFrom);
    if (index === -1) return null;

    score += index - searchFrom + 1;
    searchFrom = index + 1;
  }

  return score + haystack.length;
}
