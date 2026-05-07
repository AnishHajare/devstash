"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateDescription } from "@/actions/ai";
import { Button } from "@/components/ui/button";

type DescribeContext = {
  isPro: boolean;
  typeName: string;
  title: string;
  content: string;
  url?: string;
  language?: string;
  fileName?: string;
  tags: string[];
  currentDescription: string;
  onAccept: (description: string) => void;
};

export type DescribeSuggestionState = {
  pending: boolean;
  suggestion: string | null;
  isPro: boolean;
  runGenerate: () => void;
  accept: () => void;
  dismiss: () => void;
};

export function useDescribeSuggestion(
  ctx: DescribeContext
): DescribeSuggestionState {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<string | null>(null);

  function showUpgradeToast() {
    toast.error("Upgrade to Pro to use AI features.", {
      action: {
        label: "Upgrade",
        onClick: () => router.push("/settings"),
      },
    });
  }

  function runGenerate() {
    if (!ctx.isPro) {
      showUpgradeToast();
      return;
    }

    startTransition(async () => {
      const result = await generateDescription({
        typeName: ctx.typeName,
        title: ctx.title,
        content: ctx.content,
        url: ctx.url ?? "",
        language: ctx.language ?? "",
        fileName: ctx.fileName ?? "",
        tags: ctx.tags,
      });

      if (!result.success) {
        if (result.error.startsWith("Upgrade to Pro")) {
          showUpgradeToast();
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (result.data.description.trim() === ctx.currentDescription.trim()) {
        toast.info("Description already looks up to date.");
        setSuggestion(null);
        return;
      }

      setSuggestion(result.data.description);
    });
  }

  function accept() {
    if (!suggestion) return;
    ctx.onAccept(suggestion);
    setSuggestion(null);
  }

  function dismiss() {
    setSuggestion(null);
  }

  return {
    pending,
    suggestion,
    isPro: ctx.isPro,
    runGenerate,
    accept,
    dismiss,
  };
}

export function DescribeButton({ state }: { state: DescribeSuggestionState }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={state.runGenerate}
      title={state.isPro ? "Generate description" : "Upgrade to Pro to use AI features"}
      aria-disabled={!state.isPro}
      className="h-7 gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground aria-disabled:opacity-50"
    >
      {state.pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {state.pending ? "Writing…" : "Describe"}
    </Button>
  );
}

export function DescribeSuggestion({
  state,
}: {
  state: DescribeSuggestionState;
}) {
  if (!state.suggestion) return null;
  return (
    <div className="mt-2 rounded-md border border-dashed border-border/80 bg-muted/20 p-2 text-xs text-muted-foreground">
      <p className="leading-relaxed text-foreground/85">{state.suggestion}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={state.accept}
          aria-label="Accept generated description"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-emerald-600 hover:bg-emerald-500/10"
        >
          <Check className="h-3 w-3" />
          Accept
        </button>
        <button
          type="button"
          onClick={state.dismiss}
          aria-label="Dismiss generated description"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
