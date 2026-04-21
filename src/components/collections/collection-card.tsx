"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { CollectionActions } from "@/components/collections/collection-actions";
import { iconMap } from "@/lib/icon-map";
import type { CollectionWithMeta } from "@/lib/db/collections";

export function CollectionCard({
  collection,
}: {
  collection: CollectionWithMeta;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const dominantColor = collection.types[0]?.color;

  function openCollection() {
    router.push(`/collections/${collection.id}`);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      className="group relative rounded-lg border border-border bg-card p-4 transition-colors duration-200"
      style={{
        borderLeftColor: dominantColor,
        borderLeftWidth: dominantColor ? "3px" : undefined,
        backgroundColor: hovered && dominantColor ? `${dominantColor}12` : undefined,
      }}
      onClick={openCollection}
      onKeyDown={(event) => {
        if (event.defaultPrevented || event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCollection();
        }
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
        <CollectionActions
          key={`${collection.id}-${collection.updatedAt.toISOString()}`}
          collection={collection}
          variant="card"
        />
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
    </article>
  );
}
