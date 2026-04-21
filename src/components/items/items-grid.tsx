"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { FileListRow } from "@/components/items/file-list-row";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemWithType } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

export function ItemsGrid({
  items,
  collections,
  isGallery = false,
  isFileList = false,
}: {
  items: ItemWithType[];
  collections: CollectionOption[];
  isGallery?: boolean;
  isFileList?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function openDrawer(id: string) {
    setActiveId(id);
    setOpen(true);
  }

  const isImageItem = (item: ItemWithType) =>
    item.itemType.name.toLowerCase() === "image";

  const hasMixedImages = !isGallery && !isFileList && items.some(isImageItem);

  return (
    <>
      {isFileList ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileListRow key={item.id} item={item} onOpen={openDrawer} />
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
                  onOpen={openDrawer}
                  className={cn(
                    !isGallery &&
                      "self-start shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
                    hasMixedImages &&
                      "md:col-span-2 xl:col-span-1"
                  )}
                />
              );
            }

            return <ItemCard key={item.id} item={item} onOpen={openDrawer} />;
          })}
        </div>
      )}
      <ItemDrawer
        itemId={activeId}
        open={open}
        onOpenChange={setOpen}
        collections={collections}
      />
    </>
  );
}
