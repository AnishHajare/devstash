"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteCollection } from "@/actions/collections";
import { ItemDrawer } from "@/components/items/item-drawer";
import { Button } from "@/components/ui/button";
import type {
  CollectionOption,
  CollectionWithMeta,
} from "@/lib/db/collections";
import type { ItemWithType } from "@/lib/db/items";
import { iconMap } from "@/lib/icon-map";

type FavoritesContentProps = {
  initialItems: ItemWithType[];
  initialCollections: CollectionWithMeta[];
  collectionOptions: CollectionOption[];
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function openRowOnKeyboard(
  event: KeyboardEvent<HTMLDivElement>,
  onOpen: () => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpen();
  }
}

export function FavoritesContent({
  initialItems,
  initialCollections,
  collectionOptions,
}: FavoritesContentProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [collections, setCollections] = useState(initialCollections);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState<string[]>([]);
  const [pendingCollectionIds, setPendingCollectionIds] = useState<string[]>([]);

  async function handleItemUnfavorite(itemId: string) {
    const previousItems = items;
    setPendingItemIds((current) => [...current, itemId]);
    setItems((current) => current.filter((item) => item.id !== itemId));

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: false }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      router.refresh();
    } catch {
      setItems(previousItems);
      toast.error("Failed to update item favorite");
    } finally {
      setPendingItemIds((current) => current.filter((id) => id !== itemId));
    }
  }

  async function handleCollectionUnfavorite(collectionId: string) {
    const previousCollections = collections;
    setPendingCollectionIds((current) => [...current, collectionId]);
    setCollections((current) =>
      current.filter((collection) => collection.id !== collectionId)
    );

    const result = await toggleFavoriteCollection(collectionId, false);

    if (!result.success) {
      setCollections(previousCollections);
      toast.error(result.error);
      setPendingCollectionIds((current) =>
        current.filter((id) => id !== collectionId)
      );
      return;
    }

    setPendingCollectionIds((current) => current.filter((id) => id !== collectionId));
    router.refresh();
  }

  function openItem(itemId: string) {
    setActiveItemId(itemId);
    setDrawerOpen(true);
  }

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
            <p className="text-sm text-muted-foreground">
              Quickly revisit the items and collections you star most often.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">Total favorites</p>
            <p className="text-2xl font-bold tabular-nums">
              {items.length + collections.length}
            </p>
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <Star className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No favorites yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Star items or collections to pin your most useful work here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <FavoritesSection
              title="Items"
              count={items.length}
              emptyTitle="No favorite items"
              emptyDescription="Favorite an item from the drawer or item list to keep it close."
            >
              {items.map((item) => (
                <FavoriteItemRow
                  key={item.id}
                  item={item}
                  pending={pendingItemIds.includes(item.id)}
                  onOpen={() => openItem(item.id)}
                  onUnfavorite={() => void handleItemUnfavorite(item.id)}
                />
              ))}
            </FavoritesSection>

            <FavoritesSection
              title="Collections"
              count={collections.length}
              emptyTitle="No favorite collections"
              emptyDescription="Favorite a collection to keep your go-to groups one click away."
            >
              {collections.map((collection) => (
                <FavoriteCollectionRow
                  key={collection.id}
                  collection={collection}
                  pending={pendingCollectionIds.includes(collection.id)}
                  onOpen={() => router.push(`/collections/${collection.id}`)}
                  onUnfavorite={() =>
                    void handleCollectionUnfavorite(collection.id)
                  }
                />
              ))}
            </FavoritesSection>
          </div>
        )}
      </div>

      <ItemDrawer
        itemId={activeItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        collections={collectionOptions}
      />
    </>
  );
}

function FavoritesSection({
  title,
  count,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{count}</span>
      </div>

      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">{emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {children}
        </div>
      )}
    </section>
  );
}

function FavoriteItemRow({
  item,
  pending,
  onOpen,
  onUnfavorite,
}: {
  item: ItemWithType;
  pending: boolean;
  onOpen: () => void;
  onUnfavorite: () => void;
}) {
  const Icon = iconMap[item.itemType.icon];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => openRowOnKeyboard(event, onOpen)}
      className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${item.itemType.color}1a` }}
      >
        {Icon && (
          <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {item.title}
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {item.itemType.name}
          </span>
        </div>
      </div>

      <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
        {formatDate(item.updatedAt)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="min-h-[44px] min-w-[44px]"
        aria-label="Remove item from favorites"
        disabled={pending}
        onClick={(event) => {
          event.stopPropagation();
          onUnfavorite();
        }}
      >
        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
      </Button>
    </div>
  );
}

function FavoriteCollectionRow({
  collection,
  pending,
  onOpen,
  onUnfavorite,
}: {
  collection: CollectionWithMeta;
  pending: boolean;
  onOpen: () => void;
  onUnfavorite: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => openRowOnKeyboard(event, onOpen)}
      className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: collection.types[0]?.color
            ? `${collection.types[0].color}1a`
            : undefined,
        }}
      >
        <FolderOpen
          className="h-4 w-4 text-muted-foreground"
          style={{ color: collection.types[0]?.color }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {collection.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
        {formatDate(collection.updatedAt)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="min-h-[44px] min-w-[44px]"
        aria-label="Remove collection from favorites"
        disabled={pending}
        onClick={(event) => {
          event.stopPropagation();
          onUnfavorite();
        }}
      >
        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
      </Button>
    </div>
  );
}
