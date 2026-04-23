"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const CodeEditor = dynamic(
  () => import("@/components/items/code-editor").then((m) => m.CodeEditor),
  { ssr: false }
);
import { CollectionMultiSelect } from "@/components/items/collection-multi-select";
import { MarkdownEditor, MarkdownView } from "@/components/items/markdown-editor";
import { formatBytes } from "@/lib/format-bytes";
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
  FolderOpen,
  Tag,
  Calendar,
  Check,
  X,
  Save,
  Download,
  FileText,
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
};

type EditState = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  collectionIds: string[];
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
                />
              ) : (
                <ItemViewBody
                  item={item}
                  showLanguage={showLanguage}
                  showMarkdown={showMarkdown}
                  showFile={showFile}
                  downloadUrl={downloadUrl}
                  typeName={typeName}
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

// ── Item body panels ─────────────────────────────────────────

function ItemEditBody({
  item,
  editState,
  field,
  setEditState,
  showContent,
  showLanguage,
  showMarkdown,
  showUrl,
  collections,
}: {
  item: ItemDetail;
  editState: EditState;
  field: (key: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setEditState: React.Dispatch<React.SetStateAction<EditState | null>>;
  showContent: boolean;
  showLanguage: boolean;
  showMarkdown: boolean;
  showUrl: boolean;
  collections: CollectionOption[];
}) {
  return (
    <>
      {/* Description */}
      <section>
        <SectionLabel>Description</SectionLabel>
        <EditTextarea
          value={editState.description}
          onChange={field("description")}
          placeholder="Optional description…"
          accentColor={item.itemType.color}
          className="px-3 py-2.5 text-sm leading-relaxed min-h-[72px]"
        />
      </section>

      {/* Content */}
      {showContent && (
        <section>
          <SectionLabel>Content</SectionLabel>
          {showLanguage ? (
            <CodeEditor
              value={editState.content}
              onChange={(val) =>
                setEditState((prev) => prev && { ...prev, content: val })
              }
              language={editState.language || undefined}
              accentColor={item.itemType.color}
            />
          ) : showMarkdown ? (
            <MarkdownEditor
              value={editState.content}
              onChange={(val) =>
                setEditState((prev) => prev && { ...prev, content: val })
              }
              accentColor={item.itemType.color}
            />
          ) : (
            <EditTextarea
              value={editState.content}
              onChange={field("content")}
              placeholder="Content…"
              accentColor={item.itemType.color}
              className="px-4 py-3 text-xs leading-relaxed min-h-[260px]"
            />
          )}
        </section>
      )}

      {/* URL */}
      {showUrl && (
        <section>
          <SectionLabel>URL</SectionLabel>
          <EditInput
            type="url"
            value={editState.url}
            onChange={field("url")}
            placeholder="https://…"
            accentColor={item.itemType.color}
          />
        </section>
      )}

      {/* Language */}
      {showLanguage && (
        <section>
          <SectionLabel>Language</SectionLabel>
          <EditInput
            type="text"
            value={editState.language}
            onChange={field("language")}
            placeholder="e.g. TypeScript"
            accentColor={item.itemType.color}
          />
        </section>
      )}

      {/* Tags */}
      <section>
        <SectionLabel icon={<Tag className="h-3 w-3" />}>Tags</SectionLabel>
        <EditInput
          type="text"
          value={editState.tags}
          onChange={field("tags")}
          placeholder="react, hooks, typescript"
          accentColor={item.itemType.color}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">Comma-separated</p>
      </section>

      <section>
        <CollectionMultiSelect
          collections={collections}
          selectedIds={editState.collectionIds}
          onChange={(collectionIds) =>
            setEditState((prev) => prev && { ...prev, collectionIds })
          }
        />
      </section>

      <section>
        <SectionLabel icon={<Calendar className="h-3 w-3" />}>Details</SectionLabel>
        <div className="flex flex-col gap-1">
          <DetailRow label="Created" value={formatDate(item.createdAt)} />
          <DetailRow label="Updated" value={formatDate(item.updatedAt)} />
        </div>
      </section>
    </>
  );
}

function ItemViewBody({
  item,
  showLanguage,
  showMarkdown,
  showFile,
  downloadUrl,
  typeName,
}: {
  item: ItemDetail;
  showLanguage: boolean;
  showMarkdown: boolean;
  showFile: boolean;
  downloadUrl: string | null;
  typeName: string;
}) {
  return (
    <>
      {/* Description */}
      {item.description && (
        <section>
          <SectionLabel>Description</SectionLabel>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        </section>
      )}

      {/* Content */}
      {item.content && (
        <section>
          <SectionLabel>Content</SectionLabel>
          {showLanguage ? (
            <CodeEditor
              value={item.content}
              language={item.language ?? undefined}
              readOnly
            />
          ) : showMarkdown ? (
            <MarkdownView content={item.content} />
          ) : (
            <pre className="rounded-md bg-muted px-4 py-3 text-xs font-mono leading-relaxed whitespace-pre overflow-x-auto max-h-[260px] overflow-y-auto">
              {item.content}
            </pre>
          )}
        </section>
      )}

      {/* File / Image */}
      {showFile && item.fileUrl && (
        <section>
          <SectionLabel>File</SectionLabel>
          {typeName === "image" ? (
            <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl!}
                alt={item.fileName ?? item.title}
                className="w-full max-h-64 object-contain"
              />
              {item.fileName && (
                <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
                  <span className="truncate text-xs text-muted-foreground flex-1">{item.fileName}</span>
                  {item.fileSize != null && (
                    <span className="text-xs text-muted-foreground shrink-0">{formatBytes(item.fileSize)}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${item.itemType.color}20` }}
              >
                <FileText className="h-4 w-4" style={{ color: item.itemType.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.fileName ?? "File"}</p>
                {item.fileSize != null && (
                  <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* URL */}
      {item.url && (
        <section>
          <SectionLabel>URL</SectionLabel>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline break-all"
          >
            {item.url}
          </a>
        </section>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <section>
          <SectionLabel icon={<Tag className="h-3 w-3" />}>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      {item.collections.length > 0 && (
        <section>
          <SectionLabel icon={<FolderOpen className="h-3 w-3" />}>
            Collections
          </SectionLabel>
          <div className="flex flex-col gap-1">
            {item.collections.map((col) => (
              <span key={col.id} className="text-sm text-muted-foreground">
                {col.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Details */}
      <section>
        <SectionLabel icon={<Calendar className="h-3 w-3" />}>Details</SectionLabel>
        <div className="flex flex-col gap-1">
          <DetailRow label="Created" value={formatDate(item.createdAt)} />
          <DetailRow label="Updated" value={formatDate(item.updatedAt)} />
        </div>
      </section>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function EditInput({
  type,
  value,
  onChange,
  placeholder,
  accentColor,
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  accentColor: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:bg-muted/70"
      style={{ boxShadow: "none" }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  );
}

function EditTextarea({
  value,
  onChange,
  placeholder,
  mono,
  resizable,
  accentColor,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  mono?: boolean;
  resizable?: boolean;
  accentColor: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-md border border-border bg-muted/40 outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:bg-muted/70 ${mono ? "font-mono" : ""} ${resizable ? "resize-y" : "resize-none"} ${className}`}
      style={{ boxShadow: "none" }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  );
}

function ActionBtn({
  children,
  onClick,
  label,
  active,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed ${active ? "text-foreground" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {icon}
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/80">{value}</span>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-muted" />
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="h-px bg-border" />
      <div className="flex gap-2">
        {[60, 50, 55].map((w) => (
          <div key={w} className="h-7 rounded-md bg-muted" style={{ width: w }} />
        ))}
      </div>
      <div className="h-px bg-border" />
      <div className="space-y-3 pt-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-16 rounded-md bg-muted" />
        <div className="h-3 w-16 rounded bg-muted mt-4" />
        <div className="flex gap-1.5">
          {[40, 55, 45].map((w) => (
            <div key={w} className="h-5 rounded-full bg-muted" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
