"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function DeleteAccountSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  async function handleDelete() {
    if (confirmation !== "DELETE") return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/profile/delete-account", {
        method: "DELETE",
      });

      if (res.status === 429) {
        const data = await res.json();
        const minutes = Math.ceil(data.retryAfter / 60);
        setError(
          `Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
        <p className="font-medium text-red-600 dark:text-red-400">
          Delete this workspace account
        </p>
        <p className="mt-1 text-muted-foreground">
          This permanently removes your profile, items, collections, and tags.
        </p>
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmation("");
            setError("");
          }
        }}
      >
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              className="w-full justify-start gap-2 sm:w-auto"
            />
          }
        >
          <Trash2 className="h-4 w-4" />
          Delete Account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data
              including items, collections, and tags. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 px-0">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span>{" "}
              to confirm
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || confirmation !== "DELETE"}
            >
              {loading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
