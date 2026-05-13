"use client";

import { ItemCard } from "@/components/items/item-card";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { FileListRow } from "@/components/items/file-list-row";
import { ItemDrawer } from "@/components/items/item-drawer";
import { useItemDrawerState } from "@/components/items/use-item-drawer-state";
import type { ItemWithType } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

export function ItemsGrid({
  items,
  collections,
  isPro,
  isGallery = false,
  isFileList = false,
}: {
  items: ItemWithType[];
  collections: CollectionOption[];
  isPro: boolean;
  isGallery?: boolean;
  isFileList?: boolean;
}) {
  const drawer = useItemDrawerState();

  const isImageItem = (item: ItemWithType) =>
    item.itemType.name.toLowerCase() === "image";

  const hasMixedImages = !isGallery && !isFileList && items.some(isImageItem);

  return (
    <>
      {isFileList ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileListRow key={item.id} item={item} onOpen={drawer.openItem} />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            isGallery
              ? "grid-cols-2 md:grid-cols-3"
              : "items-start md:grid-cols-2 xl:grid-cols-3",
            hasMixedImages && "gap-4"
          )}
        >
          {items.map((item) => {
            if (isGallery || isImageItem(item)) {
              return (
                <ImageThumbnailCard
                  key={item.id}
                  item={item}
                  onOpen={drawer.openItem}
                  className={cn(
                    !isGallery &&
                      "self-start shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
                    hasMixedImages &&
                      "md:col-span-2 xl:col-span-1"
                  )}
                />
              );
            }

            return <ItemCard key={item.id} item={item} onOpen={drawer.openItem} />;
          })}
        </div>
      )}
      <ItemDrawer
        itemId={drawer.itemId}
        open={drawer.open}
        onOpenChange={drawer.setOpen}
        collections={collections}
        isPro={isPro}
      />
    </>
  );
}
