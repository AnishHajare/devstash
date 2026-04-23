import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EditorPreferencesProvider } from "@/components/editor/editor-preferences-provider";
import {
  getCollectionOptionsForUser,
  getCollectionsForUser,
} from "@/lib/db/collections";
import { getEditorPreferences } from "@/lib/db/editor-preferences";
import {
  getItemTypesWithCounts,
  getSearchableItems,
  getSidebarUser,
} from "@/lib/db/items";

export default async function CollectionsLayout({
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
    editorPreferences,
  ] = await Promise.all([
    getItemTypesWithCounts(userId),
    getCollectionsForUser(userId),
    getCollectionOptionsForUser(userId),
    getSidebarUser(userId),
    getSearchableItems(userId),
    getEditorPreferences(userId),
  ]);

  return (
    <EditorPreferencesProvider initialPreferences={editorPreferences}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <DashboardTopBar
          itemTypes={itemTypes}
          collections={collections}
          collectionOptions={collectionOptions}
          searchableItems={searchableItems}
        />

        <DashboardShell sidebarData={{ itemTypes, collections, user: sidebarUser }}>
          {children}
        </DashboardShell>
      </div>
    </EditorPreferencesProvider>
  );
}
