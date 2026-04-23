import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NewItemDialog } from "@/components/items/new-item-dialog";
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

export function DashboardTopBar({
  itemTypes,
  collections,
  collectionOptions,
  searchableItems,
}: DashboardTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
      <div className="flex w-48 shrink-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          DS
        </div>
        <span className="text-sm font-semibold">DevStash</span>
      </div>

      <div className="flex max-w-md flex-1 items-center">
        <GlobalSearch
          data={{
            items: searchableItems,
            collections: toSearchableCollections(collections),
          }}
          collections={collectionOptions}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog itemTypes={itemTypes} collections={collectionOptions} />
      </div>
    </header>
  );
}
