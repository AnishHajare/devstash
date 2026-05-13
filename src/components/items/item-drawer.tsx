"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionBtn,
  DrawerSkeleton,
  EditState,
  ItemEditBody,
  ItemViewBody,
} from "@/components/items/item-drawer-panels";
import {
  TEXT_CONTENT_TYPES,
  LANGUAGE_TYPES,
  MARKDOWN_TYPES,
} from "@/lib/item-type-constants";
import {
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { iconMap } from "@/lib/icon-map";
import {
  updateItem,
  deleteItem as deleteItemAction,
  toggleItemPin as toggleItemPinAction,
  toggleItemFavorite as toggleItemFavoriteAction,
} from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

type ItemDrawerProps = {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: CollectionOption[];
  isPro: boolean;
};

function itemToEditState(item: ItemDetail): EditState {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.map((t) => t.name).join(", "),
    collectionIds: item.collections.map((collection) => collection.id),
  };
}

export function ItemDrawer({
  itemId,
  open,
  onOpenChange,
  collections,
  isPro,
}: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [pinPending, setPinPending] = useState(false);

  useEffect(() => {
    if (!itemId || !open) return;

    let cancelled = false;

    async function loadItem() {
      setLoading(true);
      setItem(null);
      setEditing(false);
      setEditState(null);

      try {
        const response = await fetch(`/api/items/${itemId}`);
        const data = (await response.json()) as ItemDetail;
        if (!cancelled) {
          setItem(data);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load item");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId, open]);

  function startEditing() {
    if (!item) return;
    setEditState(itemToEditState(item));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditState(null);
  }

  async function saveEdits() {
    if (!item || !editState) return;
    setSaving(true);

    const tags = editState.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await updateItem(item.id, {
      title: editState.title,
      description: editState.description || null,
      content: editState.content || null,
      url: editState.url || null,
      language: editState.language || null,
      tags,
      collectionIds: editState.collectionIds,
    });

    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setItem(result.data);
    setEditing(false);
    setEditState(null);
    toast.success("Item saved");
    router.refresh();
  }

  async function toggleFavorite() {
    if (!item || favoritePending) return;
    const next = !item.isFavorite;
    setFavoritePending(true);
    setItem((current) => (current ? { ...current, isFavorite: next } : current));

    try {
      const result = await toggleItemFavoriteAction(item.id, next);
      if (!result.success) {
        setItem((current) => (current ? { ...current, isFavorite: !next } : current));
        toast.error(result.error);
        return;
      }

      toast.success(next ? "Added to favorites" : "Removed from favorites");
      router.refresh();
    } catch {
      setItem((current) => (current ? { ...current, isFavorite: !next } : current));
      toast.error("Failed to update item");
    } finally {
      setFavoritePending(false);
    }
  }

  async function togglePin() {
    if (!item || pinPending) return;
    const next = !item.isPinned;
    setPinPending(true);
    setItem((current) => (current ? { ...current, isPinned: next } : current));

    try {
      const result = await toggleItemPinAction(item.id, next);
      if (!result.success) {
        setItem((current) => (current ? { ...current, isPinned: !next } : current));
        toast.error(result.error);
        return;
      }

      toast.success(next ? "Item pinned" : "Item unpinned");
      router.refresh();
    } catch {
      setItem((current) => (current ? { ...current, isPinned: !next } : current));
      toast.error("Failed to update item");
    } finally {
      setPinPending(false);
    }
  }

  async function copyContent() {
    if (!item) return;
    const text = item.content ?? item.url ?? "";
    if (!text) {
      toast.info("Nothing to copy");
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function confirmDelete() {
    if (!item) return;
    setDeleting(true);
    const result = await deleteItemAction(item.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDeleteConfirmOpen(false);
    toast.success(`"${item.title}" deleted`);
    onOpenChange(false);
    router.refresh();
  }

  function field(key: keyof EditState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditState((prev) => prev && { ...prev, [key]: e.target.value });
  }

  const Icon = item ? iconMap[item.itemType.icon] : null;
  const typeName = item?.itemType.name.toLowerCase() ?? "";
  const showContent = TEXT_CONTENT_TYPES.includes(typeName);
  const showLanguage = LANGUAGE_TYPES.includes(typeName);
  const showMarkdown = MARKDOWN_TYPES.includes(typeName);
  const showUrl = typeName === "link";
  const showFile = typeName === "file" || typeName === "image";
  const downloadUrl = item?.fileUrl ? `/api/download/${item.fileUrl}` : null;

  return (
    <>
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-foreground">&quot;{item?.title}&quot;</strong> will be
            permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        {loading && <DrawerSkeleton />}

        {!loading && item && (
          <>
            {/* Edit mode top indicator strip */}
            {editing && (
              <div
                className="h-0.5 w-full shrink-0"
                style={{ backgroundColor: item.itemType.color }}
              />
            )}

            {/* Header */}
            <SheetHeader
              className="px-5 pt-5 pb-3 border-b border-border transition-colors"
              style={editing ? { backgroundColor: `${item.itemType.color}08` } : {}}
            >
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all"
                    style={{ backgroundColor: `${item.itemType.color}${editing ? "30" : "20"}` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: item.itemType.color }} />
                  </div>
                )}
                {editing && editState ? (
                  <input
                    autoFocus
                    value={editState.title}
                    onChange={field("title")}
                    placeholder="Title"
                    className="flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1 text-sm font-semibold outline-none transition-all duration-150 focus:border-foreground/40 focus:bg-background min-w-0"
                    style={{
                      boxShadow: "none",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.boxShadow = `0 0 0 3px ${item.itemType.color}25`)
                    }
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  />
                ) : (
                  <SheetTitle className="truncate">{item.title}</SheetTitle>
                )}
              </div>
              {/* Type + language badge row */}
              <div className="flex items-center gap-1.5 pl-9">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
                  style={{
                    backgroundColor: `${item.itemType.color}20`,
                    color: item.itemType.color,
                  }}
                >
                  {item.itemType.name}s
                </span>
                {!editing && item.language && (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {item.language}
                  </span>
                )}
                {editing && (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${item.itemType.color}15`, color: item.itemType.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: item.itemType.color }}
                    />
                    Editing
                  </span>
                )}
              </div>
            </SheetHeader>

            {/* Action bar */}
            <div
              className="flex items-center gap-0.5 border-b border-border px-3 py-2 transition-colors"
              style={editing ? { backgroundColor: `${item.itemType.color}06` } : {}}
            >
              {editing ? (
                <>
                  <button
                    onClick={saveEdits}
                    disabled={saving || !editState?.title.trim()}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: item.itemType.color }}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted ml-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <ActionBtn
                    onClick={toggleFavorite}
                    label={item.isFavorite ? "Unfavorite" : "Favorite"}
                    active={item.isFavorite}
                    disabled={favoritePending}
                  >
                    <Star
                      className="h-3.5 w-3.5"
                      style={item.isFavorite ? { fill: "#eab308", color: "#eab308" } : {}}
                    />
                  </ActionBtn>

                  <ActionBtn
                    onClick={togglePin}
                    label={item.isPinned ? "Unpin" : "Pin"}
                    active={item.isPinned}
                    disabled={pinPending}
                  >
                    <Pin
                      className="h-3.5 w-3.5"
                      style={item.isPinned ? { color: "#3b82f6" } : {}}
                    />
                  </ActionBtn>

                  <ActionBtn onClick={copyContent} label="Copy content">
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </ActionBtn>

                  {showFile && downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={item?.fileName ?? true}
                      className="flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                      aria-label="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <div className="w-px h-4 bg-border mx-1" />

                  <ActionBtn onClick={startEditing} label="Edit item">
                    <Pencil className="h-3.5 w-3.5" />
                  </ActionBtn>

                  {/* Push delete to the right */}
                  <div className="flex-1" />

                  <ActionBtn
                    onClick={() => setDeleteConfirmOpen(true)}
                    label="Delete item"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ActionBtn>
                </>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {editing && editState ? (
                <ItemEditBody
                  item={item}
                  editState={editState}
                  field={field}
                  setEditState={setEditState}
                  showContent={showContent}
                  showLanguage={showLanguage}
                  showMarkdown={showMarkdown}
                  showUrl={showUrl}
                  collections={collections}
                  isPro={isPro}
                />
              ) : (
                <ItemViewBody
                  key={item.id}
                  item={item}
                  isPro={isPro}
                  showLanguage={showLanguage}
                  showMarkdown={showMarkdown}
                  showFile={showFile}
                  downloadUrl={downloadUrl}
                  typeName={typeName}
                  onAcceptOptimizedPrompt={(nextContent) => updateItem(item.id, {
                    title: item.title,
                    description: item.description ?? null,
                    content: nextContent,
                    url: item.url ?? null,
                    language: item.language ?? null,
                    tags: item.tags.map((tag) => tag.name),
                    collectionIds: item.collections.map((collection) => collection.id),
                  })}
                  onItemUpdated={(nextItem) => {
                    setItem(nextItem);
                    toast.success("Optimized prompt applied");
                    router.refresh();
                  }}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
