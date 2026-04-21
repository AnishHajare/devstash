import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ItemsGrid } from "@/components/items/items-grid";
import { getItemsByType, getItemTypeByName } from "@/lib/db/items";
import { typeSlugToName } from "@/lib/item-type-slug";
import { iconMap } from "@/lib/icon-map";

export default async function ItemsTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { type } = await params;

  const typeName = typeSlugToName(type);

  const itemType = await getItemTypeByName(typeName);
  if (!itemType) notFound();

  const items = await getItemsByType(session.user.id, typeName);

  const Icon = iconMap[itemType.icon];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${itemType.color}20` }}
        >
          {Icon && <Icon className="h-5 w-5" style={{ color: itemType.color }} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {typeName}s
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          {Icon && (
            <Icon
              className="mb-3 h-8 w-8 text-muted-foreground/40"
              style={{ color: itemType.color }}
            />
          )}
          <p className="text-sm font-medium text-muted-foreground">
            No {typeName}s yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create your first {typeName} to get started
          </p>
        </div>
      ) : (
        <ItemsGrid
          items={items}
          isGallery={typeName.toLowerCase() === "image"}
          isFileList={typeName.toLowerCase() === "file"}
        />
      )}
    </div>
  );
}
