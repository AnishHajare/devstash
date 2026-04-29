import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { CollectionCard } from "@/components/collections/collection-card";
import { PaginationControls } from "@/components/pagination-controls";
import { getPaginatedCollectionsForUser } from "@/lib/db/collections";
import {
  COLLECTIONS_PER_PAGE,
  getPaginationRange,
  getTotalPages,
  parsePageParam,
} from "@/lib/pagination";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { page } = await searchParams;
  const currentPage = parsePageParam(page);
  const { collections, totalCount } = await getPaginatedCollectionsForUser(
    session.user.id,
    getPaginationRange(currentPage, COLLECTIONS_PER_PAGE)
  );
  const totalPages = getTotalPages(totalCount, COLLECTIONS_PER_PAGE);

  if (currentPage > totalPages && totalCount > 0) {
    redirect(`/collections?page=${totalPages}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Browse and organize all of your saved collections.
          </p>
        </div>
        <div className="w-fit rounded-lg border border-border bg-card px-3 py-2 text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Total collections</p>
          <p className="text-2xl font-bold tabular-nums">{totalCount}</p>
        </div>
      </div>

      {totalCount === 0 ? (
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
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            getHref={(pageNumber) => `/collections?page=${pageNumber}`}
          />
        </div>
      )}
    </div>
  );
}
