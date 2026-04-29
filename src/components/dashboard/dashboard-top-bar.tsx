"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderPlus, Plus, Star } from "lucide-react";
import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type {
  CollectionOption,
  CollectionWithMeta,
} from "@/lib/db/collections";
import type { SearchableItem, ItemTypeWithCount } from "@/lib/db/items";
import { toSearchableCollections } from "@/lib/global-search";

type DashboardTopBarProps = {
  itemTypes: ItemTypeWithCount[];
  collections: CollectionWithMeta[];
  collectionOptions: CollectionOption[];
  searchableItems: SearchableItem[];
};

const iconBtnClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50";

export function DashboardTopBar({
  itemTypes,
  collections,
  collectionOptions,
  searchableItems,
}: DashboardTopBarProps) {
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:gap-4">
      {/* Logo — hide text on mobile */}
      <div className="flex shrink-0 items-center gap-2 sm:w-48">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          DS
        </div>
        <span className="hidden text-sm font-semibold sm:inline">
          DevStash
        </span>
      </div>

      {/* Search — full bar on sm+, icon-only on mobile */}
      <div className="flex max-w-md flex-1 items-center">
        <GlobalSearch
          data={{
            items: searchableItems,
            collections: toSearchableCollections(collections),
          }}
          collections={collectionOptions}
        />
      </div>

      {/* Desktop actions — visible sm+ */}
      <div className="ml-auto hidden items-center gap-2 sm:flex">
        <Link
          href="/favorites"
          aria-label="Open favorites"
          className={iconBtnClass}
        >
          <Star className="h-3.5 w-3.5" />
        </Link>
        <NewCollectionDialog />
        <NewItemDialog itemTypes={itemTypes} collections={collectionOptions} />
      </div>

      {/* Mobile actions — "+" dropdown visible below sm */}
      <div className="ml-auto flex items-center gap-2 sm:hidden">
        <Link
          href="/favorites"
          aria-label="Open favorites"
          className={iconBtnClass}
        >
          <Star className="h-3.5 w-3.5" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(iconBtnClass, "cursor-pointer")}
            aria-label="Create new"
          >
            <Plus className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuItem onClick={() => setNewItemOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setNewCollectionOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden dialog instances controlled by dropdown state */}
        <NewItemDialog
          itemTypes={itemTypes}
          collections={collectionOptions}
          open={newItemOpen}
          onOpenChange={setNewItemOpen}
          hideTrigger
        />
        <NewCollectionDialog
          open={newCollectionOpen}
          onOpenChange={setNewCollectionOpen}
          hideTrigger
        />
      </div>
    </header>
  );
}
