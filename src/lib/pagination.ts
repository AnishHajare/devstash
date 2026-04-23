export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;

export function parsePageParam(page: string | string[] | undefined): number {
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);

  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export function getPaginationRange(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export function getTotalPages(totalCount: number, perPage: number): number {
  return Math.max(1, Math.ceil(totalCount / perPage));
}
