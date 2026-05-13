"use client";

import { useState } from "react";

export function useItemDrawerState() {
  const [itemId, setItemId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function openItem(id: string) {
    setItemId(id);
    setOpen(true);
  }

  return {
    itemId,
    open,
    setOpen,
    openItem,
  };
}
