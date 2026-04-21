import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { Input } from "@/components/ui/input";
import {
  getCollectionOptionsForUser,
  getCollectionsForUser,
} from "@/lib/db/collections";
import { getItemTypesWithCounts, getSidebarUser } from "@/lib/db/items";

export default async function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [itemTypes, collections, collectionOptions, sidebarUser] = await Promise.all([
    getItemTypesWithCounts(userId),
    getCollectionsForUser(userId),
    getCollectionOptionsForUser(userId),
    getSidebarUser(userId),
  ]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
        <div className="flex w-48 shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            DS
          </div>
          <span className="text-sm font-semibold">DevStash</span>
        </div>

        <div className="flex max-w-md flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="h-8 border-border bg-muted/50 pl-8 text-sm"
            />
          </div>
          <kbd className="hidden h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <NewCollectionDialog />
          <NewItemDialog itemTypes={itemTypes} collections={collectionOptions} />
        </div>
      </header>

      <DashboardShell sidebarData={{ itemTypes, collections, user: sidebarUser }}>
        {children}
      </DashboardShell>
    </div>
  );
}
