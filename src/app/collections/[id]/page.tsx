import { notFound, redirect } from "next/navigation";
import { FolderOpen, Star } from "lucide-react";
import { auth } from "@/auth";
import { CollectionActions } from "@/components/collections/collection-actions";
import { ItemsGrid } from "@/components/items/items-grid";
import { PaginationControls } from "@/components/pagination-controls";
import {
  getCollectionOptionsForUser,
  getCollectionWithItems,
} from "@/lib/db/collections";
import { iconMap } from "@/lib/icon-map";
import {
  COLLECTIONS_PER_PAGE,
  getPaginationRange,
  getTotalPages,
  parsePageParam,
} from "@/lib/pagination";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;
  const { page } = await searchParams;
  const currentPage = parsePageParam(page);

  const [collection, collectionOptions] = await Promise.all([
    getCollectionWithItems(
      session.user.id,
      id,
      getPaginationRange(currentPage, COLLECTIONS_PER_PAGE)
    ),
    getCollectionOptionsForUser(session.user.id),
  ]);

  if (!collection) notFound();

  const totalPages = getTotalPages(collection.itemCount, COLLECTIONS_PER_PAGE);

  if (currentPage > totalPages && collection.itemCount > 0) {
    redirect(`/collections/${id}?page=${totalPages}`);
  }

  const dominantColor = collection.types[0]?.color;
  const standardItems = collection.items.filter(
    (item) => item.itemType.name.toLowerCase() !== "image"
  );
  const imageItems = collection.items.filter(
    (item) => item.itemType.name.toLowerCase() === "image"
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: dominantColor ? `${dominantColor}20` : undefined,
                }}
              >
                <FolderOpen
                  className="h-5 w-5 text-muted-foreground"
                  style={{ color: dominantColor }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight">
                    {collection.name}
                  </h1>
                  {collection.isFavorite && (
                    <Star className="h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            {collection.description && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <CollectionActions
              key={`${collection.id}-${collection.updatedAt.toISOString()}`}
              collection={collection}
              variant="detail"
            />
            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <MetadataCard label="Items" value={collection.itemCount.toString()} />
              <MetadataCard
                label="Types"
                value={collection.types.length.toString()}
              />
            </div>
          </div>
        </div>

        {collection.types.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {collection.types.map((type) => {
              const Icon = iconMap[type.icon];

              return (
                <div
                  key={type.name}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
                >
                  {Icon && (
                    <Icon className="h-3.5 w-3.5" style={{ color: type.color }} />
                  )}
                  <span className="font-medium text-foreground">{type.name}</span>
                  <span>{type.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        {collection.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No items in this collection yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add an item to this collection from the item create or edit flows.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {standardItems.length > 0 && (
              <div>
                <ItemsGrid items={standardItems} collections={collectionOptions} />
              </div>
            )}

            {imageItems.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Visual references and screenshots in this collection.
                  </p>
                </div>
                <ItemsGrid
                  items={imageItems}
                  collections={collectionOptions}
                  isGallery
                />
              </div>
            )}

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              getHref={(pageNumber) => `/collections/${id}?page=${pageNumber}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
