"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  FolderOpen,
  Pin,
  Package,
  Heart,
} from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import { CollectionCard } from "@/components/collections/collection-card";
import { ItemDrawer } from "@/components/items/item-drawer";
import type { CollectionOption, CollectionWithMeta } from "@/lib/db/collections";
import type { ItemWithType } from "@/lib/db/items";

// ── Main component ──────────────────────────────────────────

type DashboardMainProps = {
  collections: CollectionWithMeta[];
  collectionStats: {
    totalCollections: number;
    favoriteCollections: number;
  };
  pinnedItems: ItemWithType[];
  recentItems: ItemWithType[];
  itemStats: {
    totalItems: number;
    favoriteItems: number;
  };
  collectionOptions: CollectionOption[];
};

export function DashboardMain({
  collections,
  collectionStats,
  pinnedItems,
  recentItems,
  itemStats,
  collectionOptions,
}: DashboardMainProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDrawer(id: string) {
    setActiveId(id);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Items"
          value={itemStats.totalItems}
          icon={<Package className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Collections"
          value={collectionStats.totalCollections}
          icon={<FolderOpen className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Favorite Items"
          value={itemStats.favoriteItems}
          icon={<Heart className="h-4 w-4 text-rose-400" />}
        />
        <StatCard
          label="Favorite Collections"
          value={collectionStats.favoriteCollections}
          icon={<Star className="h-4 w-4 text-yellow-400" />}
        />
      </div>

      {/* Collections */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>

      {/* Pinned */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} onOpen={openDrawer} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Items</h2>
        </div>
        <div className="space-y-2">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} onOpen={openDrawer} />
          ))}
        </div>
      </section>

      <ItemDrawer
        itemId={activeId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        collections={collectionOptions}
      />
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

// ── Item Row ────────────────────────────────────────────────

function ItemRow({
  item,
  onOpen,
}: {
  item: ItemWithType;
  onOpen?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconMap[item.itemType.icon];
  const color = item.itemType.color;

  return (
    <div
      onClick={() => onOpen?.(item.id)}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors duration-200 cursor-pointer"
      style={{
        borderLeftColor: color,
        borderLeftWidth: "3px",
        backgroundColor: hovered && color ? `${color}12` : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Type icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200"
        style={{ backgroundColor: hovered ? `${color}25` : `${color}15` }}
      >
        {Icon && (
          <Icon className="h-4 w-4" style={{ color }} />
        )}
      </div>

      {/* Info */}
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
        {item.description && (
          <p className="truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <span className="hidden sm:block shrink-0 text-xs text-muted-foreground/60">
        {new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}
