"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { iconMap } from "@/lib/icon-map";
import { createItem } from "@/actions/items";
import type { ItemTypeWithCount } from "@/lib/db/items";

type ItemType = Pick<ItemTypeWithCount, "id" | "name" | "icon" | "color">;

type Props = {
  itemTypes: ItemType[];
};

const TEXT_TYPES = ["snippet", "prompt", "command", "note"];
const LANGUAGE_TYPES = ["snippet", "command"];
const EXCLUDED_TYPES = ["file", "image"];

function getContentType(typeName: string): "text" | "url" {
  return typeName === "link" ? "url" : "text";
}

const EMPTY_FORM = {
  title: "",
  description: "",
  content: "",
  url: "",
  language: "",
  tags: "",
};

export function NewItemDialog({ itemTypes }: Props) {
  const router = useRouter();
  const visibleTypes = itemTypes.filter(
    (t) => !EXCLUDED_TYPES.includes(t.name.toLowerCase())
  );

  const defaultType = visibleTypes.find((t) => t.name === "snippet") ?? visibleTypes[0];

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ItemType>(defaultType);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedType(defaultType);
      setForm(EMPTY_FORM);
    }
  }

  function handleTypeSelect(type: ItemType) {
    setSelectedType(type);
    setForm((prev) => ({ ...prev, content: "", url: "", language: "" }));
  }

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const typeName = selectedType.name.toLowerCase();
    const contentType = getContentType(typeName);
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await createItem({
      typeId: selectedType.id,
      typeName,
      contentType,
      title: form.title,
      description: form.description || undefined,
      content: form.content || undefined,
      url: form.url || undefined,
      language: form.language || undefined,
      tags,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${result.data.title}" created`);
    handleOpenChange(false);
    router.refresh();
  }

  const typeName = selectedType.name.toLowerCase();
  const showContent = TEXT_TYPES.includes(typeName);
  const showLanguage = LANGUAGE_TYPES.includes(typeName);
  const showUrl = typeName === "link";
  const isMonoContent = LANGUAGE_TYPES.includes(typeName);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" className="h-8 text-xs gap-1.5" />
        }
      >
        <Plus className="h-3.5 w-3.5" />
        New Item
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
          <DialogDescription>Add a new item to your stash</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {visibleTypes.map((type) => {
              const Icon = iconMap[type.icon];
              const isActive = selectedType.id === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors"
                  style={
                    isActive
                      ? {
                          backgroundColor: type.color + "22",
                          color: type.color,
                          border: `1px solid ${type.color}66`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: "var(--muted-foreground)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span className="capitalize">{type.name}</span>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ni-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ni-title"
              value={form.title}
              onChange={set("title")}
              placeholder="Enter a title"
              required
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ni-description">Description</Label>
            <Input
              id="ni-description"
              value={form.description}
              onChange={set("description")}
              placeholder="Optional description"
              className="h-8 text-sm"
            />
          </div>

          {/* Content */}
          {showContent && (
            <div className="space-y-1.5">
              <Label htmlFor="ni-content">
                Content <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="ni-content"
                value={form.content}
                onChange={set("content")}
                placeholder={
                  typeName === "snippet" || typeName === "command"
                    ? "Paste your code or command here..."
                    : "Enter content..."
                }
                required
                className={`w-full min-h-[120px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  isMonoContent ? "font-mono" : ""
                }`}
              />
            </div>
          )}

          {/* URL */}
          {showUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="ni-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ni-url"
                type="url"
                value={form.url}
                onChange={set("url")}
                placeholder="https://..."
                required
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Language */}
          {showLanguage && (
            <div className="space-y-1.5">
              <Label htmlFor="ni-language">Language</Label>
              <Input
                id="ni-language"
                value={form.language}
                onChange={set("language")}
                placeholder="e.g. TypeScript, bash"
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="ni-tags">Tags</Label>
            <Input
              id="ni-tags"
              value={form.tags}
              onChange={set("tags")}
              placeholder="react, hooks, auth (comma-separated)"
              className="h-8 text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
