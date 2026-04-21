import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Input } from "@/components/ui/input";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { Search } from "lucide-react";
import { getCollectionsForUser } from "@/lib/db/collections";
import { getItemTypesWithCounts, getSidebarUser } from "@/lib/db/items";

export default async function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [itemTypes, collections, sidebarUser] = await Promise.all([
    getItemTypesWithCounts(userId),
    getCollectionsForUser(userId),
    getSidebarUser(userId),
  ]);

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
          <NewCollectionDialog />
          <NewItemDialog itemTypes={itemTypes} />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <DashboardShell sidebarData={{ itemTypes, collections, user: sidebarUser }}>
        {children}
      </DashboardShell>
    </div>
  );
}
