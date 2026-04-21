"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import type { CollectionWithMeta } from "@/lib/db/collections";

export function CollectionCard({
  collection,
}: {
  collection: CollectionWithMeta;
}) {
  const [hovered, setHovered] = useState(false);
  const dominantColor = collection.types[0]?.color;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative rounded-lg border border-border bg-card p-4 transition-colors duration-200"
      style={{
        borderLeftColor: dominantColor,
        borderLeftWidth: dominantColor ? "3px" : undefined,
        backgroundColor: hovered && dominantColor ? `${dominantColor}12` : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate text-sm font-medium transition-colors duration-200"
              style={{ color: hovered && dominantColor ? dominantColor : undefined }}
            >
              {collection.name}
            </span>
            {collection.isFavorite && (
              <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          aria-label="Collection options"
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
          onClick={(event) => event.preventDefault()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      {collection.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
          {collection.description}
        </p>
      )}
      {collection.types.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          {collection.types.map((type) => {
            const Icon = iconMap[type.icon];
            return Icon ? (
              <Icon
                key={type.name}
                className="h-3 w-3"
                style={{ color: type.color }}
              />
            ) : null;
          })}
        </div>
      )}
    </Link>
  );
}
