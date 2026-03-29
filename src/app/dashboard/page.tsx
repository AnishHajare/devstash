import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardMain } from "@/components/dashboard/dashboard-main";
import { Plus, Search } from "lucide-react";
import {
  getCollectionsForUser,
  getCollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
  getItemTypesWithCounts,
  getSidebarUser,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

// Hardcoded demo user until auth is set up
async function getDemoUserId() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });
  return user?.id;
}

export default async function DashboardPage() {
  const userId = await getDemoUserId();

  const [collections, collectionStats, pinnedItems, recentItems, itemStats, itemTypes, sidebarUser] =
    userId
      ? await Promise.all([
          getCollectionsForUser(userId),
          getCollectionStats(userId),
          getPinnedItems(userId),
          getRecentItems(userId),
          getItemStats(userId),
          getItemTypesWithCounts(userId),
          getSidebarUser(userId),
        ])
      : [
          [],
          { totalCollections: 0, favoriteCollections: 0 },
          [],
          [],
          { totalItems: 0, favoriteItems: 0 },
          [],
          { name: null, email: null },
        ];

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
        <div className="flex items-center gap-2 w-48 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            DS
          </div>
          <span className="font-semibold text-sm">DevStash</span>
        </div>

        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 h-8 bg-muted/50 border-border text-sm"
            />
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            New Collection
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Item
          </Button>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <DashboardShell sidebarData={{ itemTypes, collections, user: sidebarUser }}>
        <DashboardMain
          collections={collections}
          collectionStats={collectionStats}
          pinnedItems={pinnedItems}
          recentItems={recentItems}
          itemStats={itemStats}
        />
      </DashboardShell>
    </div>
  );
}
