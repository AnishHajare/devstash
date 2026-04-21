import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardMain } from "@/components/dashboard/dashboard-main";
import {
  getCollectionsForUser,
  deriveCollectionStats,
} from "@/lib/db/collections";
import {
  getPinnedItems,
  getRecentItems,
  getItemStats,
} from "@/lib/db/items";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [collections, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getCollectionsForUser(userId),
      getPinnedItems(userId),
      getRecentItems(userId),
      getItemStats(userId),
    ]);

  const collectionStats = deriveCollectionStats(collections);

  return (
    <DashboardMain
      collections={collections}
      collectionStats={collectionStats}
      pinnedItems={pinnedItems}
      recentItems={recentItems}
      itemStats={itemStats}
    />
  );
}
