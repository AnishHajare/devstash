"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { iconMap } from "@/lib/icon-map";
import type { ItemDetail } from "@/lib/db/items";

type ItemDrawerProps = {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDrawer({ itemId, open, onOpenChange }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!itemId || !open) return;
    setItem(null);
    setLoading(true);

    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((data: ItemDetail) => setItem(data))
      .catch(() => toast.error("Failed to load item"))
      .finally(() => setLoading(false));
  }, [itemId, open]);

  async function toggleFavorite() {
    if (!item) return;
    const next = !item.isFavorite;
    setItem({ ...item, isFavorite: next });
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });
    router.refresh();
  }

  async function togglePin() {
    if (!item) return;
    const next = !item.isPinned;
    setItem({ ...item, isPinned: next });
    await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: next }),
    });
    router.refresh();
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

  async function deleteItem() {
    if (!item) return;
    await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    toast.success("Item deleted");
    onOpenChange(false);
    router.refresh();
  }

  const Icon = item ? iconMap[item.itemType.icon] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        {loading && <DrawerSkeleton />}

        {!loading && item && (
          <>
            {/* Header */}
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: item.itemType.color }} />
                  </div>
                )}
                <SheetTitle className="truncate">{item.title}</SheetTitle>
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
                {item.language && (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {item.language}
                  </span>
                )}
              </div>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-0.5 border-b border-border px-3 py-2">
              <ActionBtn
                onClick={toggleFavorite}
                label={item.isFavorite ? "Unfavorite" : "Favorite"}
                active={item.isFavorite}
              >
                <Star
                  className="h-3.5 w-3.5"
                  style={item.isFavorite ? { fill: "#eab308", color: "#eab308" } : {}}
                />
                <span className="text-xs">Favorite</span>
              </ActionBtn>

              <ActionBtn onClick={togglePin} label={item.isPinned ? "Unpin" : "Pin"}>
                <Pin
                  className="h-3.5 w-3.5"
                  style={item.isPinned ? { color: "#3b82f6" } : {}}
                />
                <span className="text-xs">Pin</span>
              </ActionBtn>

              <ActionBtn onClick={copyContent} label="Copy content">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
              </ActionBtn>

              <div className="w-px h-4 bg-border mx-1" />

              <ActionBtn
                onClick={() => toast.info("Edit coming soon")}
                label="Edit item"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="text-xs">Edit</span>
              </ActionBtn>

              {/* Push delete to the right */}
              <div className="flex-1" />

              <ActionBtn
                onClick={deleteItem}
                label="Delete item"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </ActionBtn>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
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
                  <pre className="rounded-md bg-muted px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
                    {item.content}
                  </pre>
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
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function ActionBtn({
  children,
  onClick,
  label,
  active,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ${active ? "text-foreground" : ""} ${className}`}
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
