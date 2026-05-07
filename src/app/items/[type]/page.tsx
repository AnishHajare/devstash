import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ItemsGrid } from "@/components/items/items-grid";
import { PaginationControls } from "@/components/pagination-controls";
import { getCollectionOptionsForUser } from "@/lib/db/collections";
import { getPaginatedItemsByType, getItemTypeByName } from "@/lib/db/items";
import { typeSlugToName } from "@/lib/item-type-slug";
import { iconMap } from "@/lib/icon-map";
import { PRO_SYSTEM_TYPES } from "@/lib/item-type-constants";
import {
  getPaginationRange,
  getTotalPages,
  ITEMS_PER_PAGE,
  parsePageParam,
} from "@/lib/pagination";

export default async function ItemsTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { type } = await params;
  const { page } = await searchParams;
  const currentPage = parsePageParam(page);

  const typeName = typeSlugToName(type);

  const itemType = await getItemTypeByName(typeName);
  if (!itemType) notFound();

  // Block free users from pro-only type pages (File, Image)
  const isProType = PRO_SYSTEM_TYPES.includes(typeName);
  if (isProType && !session.user.isPro) {
    const Icon = iconMap[itemType.icon];
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${itemType.color}20` }}
        >
          {Icon && (
            <Icon className="h-8 w-8" style={{ color: itemType.color }} />
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {typeName}s are a Pro feature
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Upgrade to Pro to upload and manage {typeName.toLowerCase()}s, plus
          get unlimited items, collections, and AI features.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/settings"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Upgrade to Pro
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const [paginatedItems, collectionOptions] = await Promise.all([
    getPaginatedItemsByType(
      session.user.id,
      typeName,
      getPaginationRange(currentPage, ITEMS_PER_PAGE)
    ),
    getCollectionOptionsForUser(session.user.id),
  ]);
  const { items, totalCount } = paginatedItems;
  const totalPages = getTotalPages(totalCount, ITEMS_PER_PAGE);

  if (currentPage > totalPages && totalCount > 0) {
    redirect(`/items/${type}?page=${totalPages}`);
  }

  const Icon = iconMap[itemType.icon];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${itemType.color}20` }}
        >
          {Icon && <Icon className="h-5 w-5" style={{ color: itemType.color }} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {typeName}s
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          {Icon && (
            <Icon
              className="mb-3 h-8 w-8 text-muted-foreground/40"
              style={{ color: itemType.color }}
            />
          )}
          <p className="text-sm font-medium text-muted-foreground">
            No {typeName}s yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create your first {typeName} to get started
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <ItemsGrid
            items={items}
            collections={collectionOptions}
            isPro={session.user.isPro === true}
            isGallery={typeName.toLowerCase() === "image"}
            isFileList={typeName.toLowerCase() === "file"}
          />
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            getHref={(pageNumber) => `/items/${type}?page=${pageNumber}`}
          />
        </div>
      )}
    </div>
  );
}
