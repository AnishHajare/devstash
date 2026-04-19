"use client";

import { Pin, Star, ImageIcon } from "lucide-react";
import type { ItemWithType } from "@/lib/db/items";

export function ImageThumbnailCard({
  item,
  onOpen,
}: {
  item: ItemWithType;
  onOpen?: (id: string) => void;
}) {
  const src = item.fileUrl ? `/api/download/${item.fileUrl}` : null;

  return (
    <div
      onClick={() => onOpen?.(item.id)}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-border/80"
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {item.title}
        </span>
        {item.isPinned && (
          <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        {item.isFavorite && (
          <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
        )}
      </div>
    </div>
  );
}
