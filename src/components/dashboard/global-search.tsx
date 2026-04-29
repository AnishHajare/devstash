"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, FolderOpen, Search } from "lucide-react";
import { ItemDrawer } from "@/components/items/item-drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { iconMap } from "@/lib/icon-map";
import {
  filterGlobalSearchData,
  type GlobalSearchData,
} from "@/lib/global-search";
import type { CollectionOption } from "@/lib/db/collections";

type GlobalSearchProps = {
  data: GlobalSearchData;
  collections: CollectionOption[];
};

export function GlobalSearch({ data, collections }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(
    () => filterGlobalSearchData(data, query),
    [data, query]
  );

  function openItem(id: string) {
    setOpen(false);
    setQuery("");
    setActiveItemId(id);
    setDrawerOpen(true);
  }

  function openCollection(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/collections/${id}`);
  }

  return (
    <>
      {/* Desktop: full search bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Search items, collections...</span>
        <kbd className="ml-auto hidden h-5 shrink-0 items-center rounded border border-border bg-background px-1.5 text-xs text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Mobile: icon-only search button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="inline-flex sm:hidden size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
      >
        <Search className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[min(720px,calc(100vh-6rem))] max-w-[calc(100%-2rem)] gap-0 overflow-hidden border border-border bg-popover p-0 shadow-2xl sm:max-w-2xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <Command shouldFilter={false} className="rounded-xl">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search items and collections..."
            />
            <CommandList className="max-h-[min(620px,calc(100vh-10rem))] p-3">
              <CommandEmpty>No results found.</CommandEmpty>

              {results.items.length > 0 && (
                <CommandGroup heading="Items">
                  {results.items.map((item) => {
                    const Icon = iconMap[item.type.icon] ?? FileSearch;

                    return (
                      <CommandItem
                        key={item.id}
                        value={`item-${item.id}`}
                        onSelect={() => openItem(item.id)}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${item.type.color}20` }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: item.type.color }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {item.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.type.name}
                            </span>
                          </div>
                          {item.preview && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.preview}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {results.items.length > 0 && results.collections.length > 0 && (
                <CommandSeparator />
              )}

              {results.collections.length > 0 && (
                <CommandGroup heading="Collections">
                  {results.collections.map((collection) => {
                    const dominantColor = collection.dominantType?.color;

                    return (
                      <CommandItem
                        key={collection.id}
                        value={`collection-${collection.id}`}
                        onSelect={() => openCollection(collection.id)}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted"
                          style={{
                            backgroundColor: dominantColor
                              ? `${dominantColor}20`
                              : undefined,
                          }}
                        >
                          <FolderOpen
                            className="h-4 w-4 text-muted-foreground"
                            style={{ color: dominantColor }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{collection.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {collection.itemCount}{" "}
                            {collection.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <ItemDrawer
        itemId={activeItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        collections={collections}
      />
    </>
  );
}
