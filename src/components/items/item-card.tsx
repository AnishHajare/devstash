"use client";

import { useState } from "react";
import { Pin, Star, Copy, Check } from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import type { ItemWithType } from "@/lib/db/items";

export function ItemCard({
  item,
  onOpen,
}: {
  item: ItemWithType;
  onOpen?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = iconMap[item.itemType.icon];
  const color = item.itemType.color;

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const text = item.url ?? item.content ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      onClick={() => onOpen?.(item.id)}
      className="group flex min-h-[152px] cursor-pointer flex-col rounded-lg border border-border bg-card p-4 transition-colors duration-200"
      style={{
        borderLeftColor: color,
        borderLeftWidth: "3px",
        backgroundColor: hovered && color ? `${color}12` : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-1 flex-col">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200"
            style={{ backgroundColor: hovered ? `${color}25` : `${color}15` }}
          >
            {Icon && <Icon className="h-4 w-4" style={{ color }} />}
          </div>

          {/* Title + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="truncate text-sm font-medium transition-colors duration-200"
                style={{ color: hovered && color ? color : undefined }}
              >
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

          {/* Date */}
          <span className="shrink-0 text-xs text-muted-foreground/60">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="pl-11 pt-2">
          <p className="min-h-[20px] truncate text-xs text-muted-foreground">
            {item.description ?? "\u00A0"}
          </p>
        </div>

        <div className="flex min-h-[28px] flex-wrap items-start gap-1 pl-11 pt-2">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom row: copy button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleCopy}
          className="flex h-6 w-6 items-center justify-center rounded opacity-40 transition-opacity group-hover:opacity-100 hover:bg-muted"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
