"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCollection as deleteCollectionAction,
  toggleFavoriteCollection as toggleFavoriteCollectionAction,
  updateCollection as updateCollectionAction,
} from "@/actions/collections";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CollectionWithMeta } from "@/lib/db/collections";

type CollectionActionsProps = {
  collection: CollectionWithMeta;
  variant: "card" | "detail";
};

type CollectionFormState = {
  name: string;
  description: string;
};

export function CollectionActions({
  collection,
  variant,
}: CollectionActionsProps) {
  const router = useRouter();
  const [savedValues, setSavedValues] = useState<CollectionFormState>({
    name: collection.name,
    description: collection.description ?? "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [form, setForm] = useState<CollectionFormState>(savedValues);

  function resetForm() {
    setForm(savedValues);
  }

  function handleEditOpenChange(open: boolean) {
    setEditOpen(open);
    if (!open) resetForm();
  }

  function set(field: keyof CollectionFormState) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const result = await updateCollectionAction(collection.id, {
      name: form.name,
      description: form.description || null,
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const nextSavedValues = {
      name: result.data.name,
      description: result.data.description ?? "",
    };

    setSavedValues(nextSavedValues);
    setForm(nextSavedValues);
    toast.success(`"${result.data.name}" saved`);
    handleEditOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCollectionAction(collection.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setDeleteOpen(false);
    toast.success(`"${collection.name}" deleted`);

    if (variant === "detail") {
      router.replace("/collections");
      return;
    }

    router.refresh();
  }

  function stopPropagation(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  async function handleFavoriteToggle() {
    const nextFavorite = !isFavorite;
    setFavoritePending(true);
    setIsFavorite(nextFavorite);

    const result = await toggleFavoriteCollectionAction(collection.id, nextFavorite);

    setFavoritePending(false);

    if (!result.success) {
      setIsFavorite(!nextFavorite);
      toast.error(result.error);
      return;
    }

    setIsFavorite(result.data.isFavorite);
    toast.success(
      result.data.isFavorite
        ? `"${result.data.name}" added to favorites`
        : `"${result.data.name}" removed from favorites`
    );
    router.refresh();
  }

  const editDialog = (
    <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton onClick={stopPropagation}>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>Update the collection name and description.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`collection-name-${collection.id}`}>
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`collection-name-${collection.id}`}
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. React Patterns"
              required
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`collection-description-${collection.id}`}>
              Description
            </Label>
            <textarea
              id={`collection-description-${collection.id}`}
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
              onClick={() => handleEditOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent onClick={stopPropagation}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete collection?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-foreground">&quot;{collection.name}&quot;</strong> will
            be removed from your collections. Items stay in your stash and only this
            collection plus its item links are deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "detail") {
    return (
      <>
        {editDialog}
        {deleteDialog}
        <div className="flex flex-wrap items-center gap-2" onClick={stopPropagation}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleFavoriteToggle}
            disabled={favoritePending}
            aria-label="Favorite collection"
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`}
            />
            Favorite
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {editDialog}
      {deleteDialog}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="pointer-events-auto relative z-10 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100 hover:bg-muted"
              aria-label="Collection options"
              onClick={stopPropagation}
            />
          }
        >
          <Ellipsis className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40"
          onClick={stopPropagation}
        >
          <DropdownMenuItem
            disabled={favoritePending}
            onClick={(event) => {
              event.stopPropagation();
              void handleFavoriteToggle();
            }}
          >
            <Star className="h-4 w-4" />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
