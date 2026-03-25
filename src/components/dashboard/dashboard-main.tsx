"use client";

import Link from "next/link";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  Star,
  FolderOpen,
  Pin,
  MoreHorizontal,
  Package,
  Heart,
} from "lucide-react";
import {
  mockItems,
  mockCollections,
  mockItemTypes,
  mockItemTypeCounts,
} from "@/lib/mock-data";

// ── Icon map (shared with sidebar) ──────────────────────────

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

// ── Helpers ─────────────────────────────────────────────────

function getItemType(typeId: string) {
  return mockItemTypes.find((t) => t.id === typeId);
}

const totalItems = Object.values(mockItemTypeCounts).reduce(
  (a, b) => a + b,
  0
);
const totalCollections = mockCollections.length;
const favoriteItems = mockItems.filter((i) => i.isFavorite).length;
const favoriteCollections = mockCollections.filter((c) => c.isFavorite).length;

const pinnedItems = mockItems.filter((i) => i.isPinned);
const recentItems = mockItems.slice(0, 10);

// ── Main component ──────────────────────────────────────────

export function DashboardMain() {
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
          value={totalItems}
          icon={<Package className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Collections"
          value={totalCollections}
          icon={<FolderOpen className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Favorite Items"
          value={favoriteItems}
          icon={<Heart className="h-4 w-4 text-rose-400" />}
        />
        <StatCard
          label="Favorite Collections"
          value={favoriteCollections}
          icon={<Star className="h-4 w-4 text-yellow-400" />}
        />
      </div>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mockCollections.map((col) => (
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
          <div className="space-y-1">
            {pinnedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Recent Items</h2>
        </div>
        <div className="space-y-1">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
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
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

// ── Collection Card ─────────────────────────────────────────

function CollectionCard({
  collection,
}: {
  collection: (typeof mockCollections)[number];
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {collection.name}
            </span>
            {collection.isFavorite && (
              <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {collection.itemCount} items
          </p>
        </div>
        <button
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      {collection.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
          {collection.description}
        </p>
      )}
      {/* Type icon badges placeholder */}
      <div className="mt-3 flex items-center gap-1.5 text-muted-foreground/60">
        <FolderOpen className="h-3 w-3" />
        <Code className="h-3 w-3" />
      </div>
    </Link>
  );
}

// ── Item Row ────────────────────────────────────────────────

function ItemRow({ item }: { item: (typeof mockItems)[number] }) {
  const type = getItemType(item.itemTypeId);
  const Icon = type ? iconMap[type.icon] : null;

  return (
    <div className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50">
      {/* Type icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: type ? `${type.color}15` : undefined }}
      >
        {Icon && (
          <Icon
            className="h-4 w-4"
            style={{ color: type?.color }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{item.title}</span>
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
      {item.tags && item.tags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
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
