"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/dialog";
import { createCollection } from "@/actions/collections";

const EMPTY_FORM = { name: "", description: "" };

type NewCollectionDialogProps = {
  /** When provided, the dialog becomes controlled (parent owns open state). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extra classes applied to the default trigger button. */
  triggerClassName?: string;
  /** When true the built-in trigger button is not rendered. */
  hideTrigger?: boolean;
};

export function NewCollectionDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerClassName,
  hideTrigger,
}: NewCollectionDialogProps = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(isOpen: boolean) {
    if (isControlled) {
      controlledOnOpenChange?.(isOpen);
    } else {
      setInternalOpen(isOpen);
    }
    if (!isOpen) setForm(EMPTY_FORM);
  }

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const result = await createCollection({
      name: form.name,
      description: form.description || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${result.data.name}" created`);
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <>
      {!hideTrigger && (
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 text-xs gap-1.5", triggerClassName)}
          onClick={() => handleOpenChange(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Collection</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>Group related items together</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nc-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nc-name"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. React Patterns"
              required
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nc-description">Description</Label>
            <textarea
              id="nc-description"
              value={form.description}
              onChange={set("description")}
              placeholder="Optional description"
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
    </>
  );
}
