"use client";

import { useState } from "react";
import { ItemCard } from "@/components/items/item-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { ItemWithType } from "@/lib/db/items";

export function ItemsGrid({ items }: { items: ItemWithType[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function openDrawer(id: string) {
    setActiveId(id);
    setOpen(true);
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onOpen={openDrawer} />
        ))}
      </div>
      <ItemDrawer itemId={activeId} open={open} onOpenChange={setOpen} />
    </>
  );
}
