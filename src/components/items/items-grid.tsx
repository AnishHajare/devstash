"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { FileListRow } from "@/components/items/file-list-row";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemWithType } from "@/lib/db/items";

export function ItemsGrid({
  items,
  isGallery = false,
  isFileList = false,
}: {
  items: ItemWithType[];
  isGallery?: boolean;
  isFileList?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function openDrawer(id: string) {
    setActiveId(id);
    setOpen(true);
  }

  return (
    <>
      {isFileList ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileListRow key={item.id} item={item} onOpen={openDrawer} />
          ))}
        </div>
      ) : (
        <div className={isGallery ? "grid gap-3 grid-cols-2 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 lg:grid-cols-3"}>
          {items.map((item) =>
            isGallery ? (
              <ImageThumbnailCard key={item.id} item={item} onOpen={openDrawer} />
            ) : (
              <ItemCard key={item.id} item={item} onOpen={openDrawer} />
            )
          )}
        </div>
      )}
      <ItemDrawer itemId={activeId} open={open} onOpenChange={setOpen} />
    </>
  );
}
