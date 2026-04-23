import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getCollectionsForUser,
  getCollectionOptionsForUser,
} from "@/lib/db/collections";
import {
  getSearchableItems,
  getItemTypesWithCounts,
  getSidebarUser,
} from "@/lib/db/items";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [
    itemTypes,
    collections,
    collectionOptions,
    sidebarUser,
    searchableItems,
  ] = await Promise.all([
    getItemTypesWithCounts(userId),
    getCollectionsForUser(userId),
    getCollectionOptionsForUser(userId),
    getSidebarUser(userId),
    getSearchableItems(userId),
  ]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <DashboardTopBar
        itemTypes={itemTypes}
        collections={collections}
        collectionOptions={collectionOptions}
        searchableItems={searchableItems}
      />

      {/* Body: sidebar + main */}
      <DashboardShell sidebarData={{ itemTypes, collections, user: sidebarUser }}>
        {children}
      </DashboardShell>
    </div>
  );
}
