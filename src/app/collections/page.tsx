import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { CollectionCard } from "@/components/collections/collection-card";
import { getCollectionsForUser } from "@/lib/db/collections";

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const collections = await getCollectionsForUser(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Browse and organize all of your saved collections.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-right">
          <p className="text-xs text-muted-foreground">Total collections</p>
          <p className="text-2xl font-bold tabular-nums">{collections.length}</p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No collections yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create a collection to start grouping related items.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}
