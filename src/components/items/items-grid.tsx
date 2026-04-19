"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemWithType } from "@/lib/db/items";

export function ItemsGrid({
  items,
  isGallery = false,
}: {
  items: ItemWithType[];
  isGallery?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function openDrawer(id: string) {
    setActiveId(id);
    setOpen(true);
  }

  return (
    <>
      <div className={isGallery ? "grid gap-3 grid-cols-2 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 lg:grid-cols-3"}>
        {items.map((item) =>
          isGallery ? (
            <ImageThumbnailCard key={item.id} item={item} onOpen={openDrawer} />
          ) : (
            <ItemCard key={item.id} item={item} onOpen={openDrawer} />
          )
        )}
      </div>
      <ItemDrawer itemId={activeId} open={open} onOpenChange={setOpen} />
    </>
  );
}
