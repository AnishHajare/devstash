"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Star,
  FolderOpen,
  LogOut,
  ChevronRight,
  Circle,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { iconMap } from "@/lib/icon-map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRO_SYSTEM_TYPES } from "@/lib/item-type-constants";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { typeNameToSlug } from "@/lib/item-type-slug";
import type { ItemTypeWithCount, SidebarUser } from "@/lib/db/items";
import type { CollectionWithMeta } from "@/lib/db/collections";

export type SidebarData = {
  itemTypes: ItemTypeWithCount[];
  collections: CollectionWithMeta[];
  user: SidebarUser;
};

function getInitials(name: string | null | undefined): string {
  return name?.split(" ").map((n) => n[0]).join("") ?? "?";
}

function pluralizeTypeName(name: string): string {
  if (name.toLowerCase() === "image") {
    return "Images";
  }
  if (name.toLowerCase() === "file") {
    return "Files";
  }
  return `${name}s`;
}

export function SidebarContent({ collapsed, data }: { collapsed: boolean; data: SidebarData }) {
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [allOpen, setAllOpen] = useState(true);

  if (collapsed) {
    return <CollapsedSidebar data={data} />;
  }

  const favoriteCollections = data.collections.filter((c) => c.isFavorite);
  const recentCollections = data.collections.filter((c) => !c.isFavorite);

  return (
    <div className="flex h-full flex-col">
      {/* Types */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Types</SectionLabel>
        <nav className="mt-1 space-y-0.5">
          {data.itemTypes.map((type) => {
            const Icon = iconMap[type.icon];
            const isProType = type.isSystem && PRO_SYSTEM_TYPES.includes(type.name);
            return (
              <Link
                key={type.id}
                href={`/items/${typeNameToSlug(type.name)}`}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {Icon && (
                  <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                )}
                <span className="truncate">{pluralizeTypeName(type.name)}</span>
                {isProType && (
                  <Badge variant="outline" className="ml-auto h-4 px-1 text-[10px] leading-none font-semibold tracking-wide text-zinc-400 border-zinc-400/50">
                    PRO
                  </Badge>
                )}
                <span className={`text-xs tabular-nums text-muted-foreground/60 ${!isProType ? "ml-auto" : ""}`}>
                  {type.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-3" />

        {/* Collections */}
        <SectionLabel>Collections</SectionLabel>

        {/* Favorites */}
        {favoriteCollections.length > 0 && (
          <CollapsibleSection
            label="Favorites"
            open={favoritesOpen}
            onToggle={() => setFavoritesOpen(!favoritesOpen)}
          >
            <nav className="space-y-0.5">
              {favoriteCollections.map((col) => (
                <SidebarCollectionLink
                  key={col.id}
                  id={col.id}
                  name={col.name}
                  itemCount={col.itemCount}
                  icon={<Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />}
                />
              ))}
            </nav>
          </CollapsibleSection>
        )}

        {/* Recent Collections */}
        <CollapsibleSection
          label="Recent"
          open={allOpen}
          onToggle={() => setAllOpen(!allOpen)}
        >
          <nav className="space-y-0.5">
            {recentCollections.map((col) => {
              const dominantColor = col.types[0]?.color;
              return (
                <SidebarCollectionLink
                  key={col.id}
                  id={col.id}
                  name={col.name}
                  itemCount={col.itemCount}
                  icon={
                    dominantColor ? (
                      <Circle
                        className="h-3 w-3 shrink-0"
                        style={{ color: dominantColor, fill: dominantColor }}
                      />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                    )
                  }
                />
              );
            })}
          </nav>
        </CollapsibleSection>

        {/* View all collections link */}
        <Link
          href="/collections"
          className="mt-2 flex items-center justify-center rounded-md px-2 py-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          View all collections
        </Link>
      </div>

      {/* User area */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-2 flex justify-end">
          <ThemeToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md p-1 transition-colors hover:bg-muted">
            <Avatar size="sm">
              {data.user.image && <AvatarImage src={data.user.image} alt={data.user.name ?? "User"} />}
              <AvatarFallback>
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium leading-tight">
                {data.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {data.user.email}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ redirectTo: "/sign-in" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function CollapsedSidebar({ data }: { data: SidebarData }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {data.itemTypes.map((type) => {
          const Icon = iconMap[type.icon];
          return (
            <Link
              key={type.id}
              href={`/items/${typeNameToSlug(type.name)}`}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={typeNameToSlug(type.name)}
              aria-label={pluralizeTypeName(type.name)}
            >
              {Icon && <Icon className="h-4 w-4" style={{ color: type.color }} />}
            </Link>
          );
        })}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2 border-t border-border py-3">
        <ThemeToggle />
        <Link href="/dashboard/profile" aria-label="Open profile">
          <Avatar size="sm">
            {data.user.image && <AvatarImage src={data.user.image} alt={data.user.name ?? "User"} />}
            <AvatarFallback>
              {getInitials(data.user.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
}

function SidebarCollectionLink({
  id,
  name,
  itemCount,
  icon,
}: {
  id: string;
  name: string;
  itemCount: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={`/collections/${id}`}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span className="truncate">{name}</span>
      <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
        {itemCount}
      </span>
    </Link>
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
