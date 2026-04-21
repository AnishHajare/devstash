"use client";

import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CollectionOption } from "@/lib/db/collections";

type CollectionMultiSelectProps = {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function CollectionMultiSelect({
  collections,
  selectedIds,
  onChange,
  disabled = false,
  label = "Collections",
  placeholder = "Select collections",
}: CollectionMultiSelectProps) {
  const selectedCollections = collections.filter((collection) =>
    selectedIds.includes(collection.id)
  );

  function toggleCollection(collectionId: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds, collectionId]);
      return;
    }

    onChange(selectedIds.filter((id) => id !== collectionId));
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-8 w-full justify-between px-3 py-2 text-sm"
              disabled={disabled || collections.length === 0}
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-left">
              {selectedCollections.length > 0
                ? selectedCollections.map((collection) => collection.name).join(", ")
                : collections.length > 0
                  ? placeholder
                  : "No collections yet"}
            </span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {selectedCollections.length}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select collections</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {collections.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Create a collection first to organize items.
              </div>
            ) : (
              collections.map((collection) => (
                <DropdownMenuCheckboxItem
                  key={collection.id}
                  checked={selectedIds.includes(collection.id)}
                  closeOnClick={false}
                  onCheckedChange={(checked) =>
                    toggleCollection(collection.id, checked === true)
                  }
                >
                  {collection.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
