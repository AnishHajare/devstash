"use client";

import { useState } from "react";
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
  Settings,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  mockItemTypes,
  mockItemTypeCounts,
  mockCollections,
  mockUser,
} from "@/lib/mock-data";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

const countMap = mockItemTypeCounts as Record<string, number>;

const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
const allCollections = mockCollections.filter((c) => !c.isFavorite);

export function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [allOpen, setAllOpen] = useState(true);

  if (collapsed) {
    return <CollapsedSidebar />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Types */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Types</SectionLabel>
        <nav className="mt-1 space-y-0.5">
          {mockItemTypes.map((type) => {
            const Icon = iconMap[type.icon];
            const count = countMap[type.name.toLowerCase()] ?? 0;
            return (
              <Link
                key={type.id}
                href={`/items/${type.name.toLowerCase()}s`}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {Icon && (
                  <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                )}
                <span className="truncate">{type.name}s</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3" />

        {/* Collections */}
        <SectionLabel>Collections</SectionLabel>

        {/* Favorites */}
        <CollapsibleSection
          label="Favorites"
          open={favoritesOpen}
          onToggle={() => setFavoritesOpen(!favoritesOpen)}
        >
          <nav className="space-y-0.5">
            {favoriteCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                  {col.itemCount}
                </span>
              </Link>
            ))}
          </nav>
        </CollapsibleSection>

        {/* All Collections */}
        <CollapsibleSection
          label="All Collections"
          open={allOpen}
          onToggle={() => setAllOpen(!allOpen)}
        >
          <nav className="space-y-0.5">
            {allCollections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                  {col.itemCount}
                </span>
              </Link>
            ))}
          </nav>
        </CollapsibleSection>
      </div>

      {/* User area */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>
              {mockUser.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {mockUser.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {mockUser.email}
            </p>
          </div>
          <button className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CollapsedSidebar() {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {mockItemTypes.map((type) => {
          const Icon = iconMap[type.icon];
          return (
            <Link
              key={type.id}
              href={`/items/${type.name.toLowerCase()}s`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={type.name + "s"}
            >
              {Icon && <Icon className="h-4 w-4" style={{ color: type.color }} />}
            </Link>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-border py-3">
        <Avatar size="sm">
          <AvatarFallback>
            {mockUser.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") ?? "?"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

function CollapsibleSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 transition-colors hover:text-muted-foreground"
      >
        <span>{label}</span>
        <ChevronRight
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-2 text-xs font-semibold text-muted-foreground">
      {children}
    </h3>
  );
}
