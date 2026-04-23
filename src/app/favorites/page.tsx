import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FavoritesContent } from "@/components/favorites/favorites-content";
import {
  getCollectionOptionsForUser,
  getFavoriteCollections,
} from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id;

  const [items, collections, collectionOptions] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
    getCollectionOptionsForUser(userId),
  ]);

  return (
    <FavoritesContent
      initialItems={items}
      initialCollections={collections}
      collectionOptions={collectionOptions}
    />
  );
}
