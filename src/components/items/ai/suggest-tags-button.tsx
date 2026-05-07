"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateAutoTags } from "@/actions/ai";

type SuggestTagsButtonProps = {
  itemId?: string;
  title: string;
  content: string;
  typeName?: string;
  existingTags: string[];
  onAccept: (tag: string) => void;
};

export function SuggestTagsButton({
  itemId,
  title,
  content,
  typeName,
  existingTags,
  onAccept,
}: SuggestTagsButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  const existingSet = new Set(existingTags.map((t) => t.toLowerCase()));

  function runSuggest() {
    startTransition(async () => {
      const result = await generateAutoTags({
        itemId,
        title,
        content,
        typeName,
      });

      if (!result.success) {
        if (result.error.startsWith("Upgrade to Pro")) {
          toast.error(result.error, {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/settings"),
            },
          });
        } else {
          toast.error(result.error);
        }
        return;
      }

      const fresh = result.data.tags.filter((t) => !existingSet.has(t));
      if (fresh.length === 0) {
        toast.info("All suggested tags are already added.");
        return;
      }
      setSuggestions(fresh);
    });
  }

  function accept(tag: string) {
    onAccept(tag);
    setSuggestions((prev) => prev?.filter((t) => t !== tag) ?? null);
  }

  function reject(tag: string) {
    setSuggestions((prev) => prev?.filter((t) => t !== tag) ?? null);
  }

  function dismissAll() {
    setSuggestions(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={runSuggest}
          disabled={pending}
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {pending ? "Suggesting…" : "Suggest tags"}
        </Button>
        {suggestions && suggestions.length > 0 && (
          <button
            type="button"
            onClick={dismissAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss all
          </button>
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs text-muted-foreground"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => accept(tag)}
                aria-label={`Accept ${tag}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-500/15"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => reject(tag)}
                aria-label={`Reject ${tag}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
