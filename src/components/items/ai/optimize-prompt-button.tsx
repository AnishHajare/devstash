"use client";

import { useState, useTransition } from "react";
import { Check, Crown, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { optimizePrompt } from "@/actions/ai";
import { MarkdownView } from "@/components/items/markdown-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UsePromptOptimizerContext = {
  itemId: string;
  isPro: boolean;
  currentContent: string;
  onAccept: (optimizedPrompt: string) => void | Promise<void | boolean>;
};

export type PromptOptimizerState = {
  optimizedPrompt: string | null;
  pending: boolean;
  isPro: boolean;
  view: "prompt" | "optimize";
  setView: (view: "prompt" | "optimize") => void;
  runOptimize: () => void;
  accept: () => Promise<void>;
  dismiss: () => void;
};

export function usePromptOptimizer(
  ctx: UsePromptOptimizerContext
): PromptOptimizerState {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [view, setView] = useState<"prompt" | "optimize">("prompt");

  function showUpgradeToast() {
    toast.error("Upgrade to Pro to use AI features.", {
      action: {
        label: "Upgrade",
        onClick: () => router.push("/settings"),
      },
    });
  }

  function runOptimize() {
    if (!ctx.isPro) {
      showUpgradeToast();
      return;
    }

    startTransition(async () => {
      const result = await optimizePrompt({
        itemId: ctx.itemId,
        content: ctx.currentContent,
      });

      if (!result.success) {
        if (result.error.startsWith("Upgrade to Pro")) {
          showUpgradeToast();
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (
        result.data.optimizedPrompt.trim() === ctx.currentContent.trim()
      ) {
        toast.info("Prompt already looks up to date.");
        setOptimizedPrompt(null);
        setView("prompt");
        return;
      }

      setOptimizedPrompt(result.data.optimizedPrompt);
      setView("optimize");
    });
  }

  async function accept() {
    if (!optimizedPrompt) return;
    const result = await ctx.onAccept(optimizedPrompt);
    if (result === false) return;
    setOptimizedPrompt(null);
    setView("prompt");
  }

  function dismiss() {
    setOptimizedPrompt(null);
    setView("prompt");
  }

  return {
    optimizedPrompt,
    pending,
    isPro: ctx.isPro,
    view,
    setView,
    runOptimize,
    accept,
    dismiss,
  };
}

export function OptimizePromptButton({
  state,
}: {
  state: Pick<PromptOptimizerState, "pending" | "isPro" | "runOptimize">;
}) {
  const button = (
    <button
      type="button"
      onClick={state.runOptimize}
      title={state.isPro ? "Optimize prompt" : "AI features require Pro subscription"}
      aria-disabled={!state.isPro}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-white/10 shrink-0 aria-disabled:opacity-60 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground"
    >
      {state.pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          {!state.isPro && <Crown className="h-3.5 w-3.5" />}
          <Sparkles className="h-3.5 w-3.5" />
        </>
      )}
      <span>{state.pending ? "Optimizing…" : "Optimize"}</span>
    </button>
  );

  if (state.isPro) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span />}>{button}</TooltipTrigger>
        <TooltipContent>AI features require Pro subscription</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function OptimizePromptSuggestion({
  state,
  className,
  markdownClassName,
  markdownBackgroundColor,
}: {
  state: Pick<
    PromptOptimizerState,
    "optimizedPrompt" | "accept" | "dismiss"
  >;
  className?: string;
  markdownClassName?: string;
  markdownBackgroundColor?: string;
}) {
  if (!state.optimizedPrompt) return null;

  return (
    <div className={className}>
      <MarkdownView
        content={state.optimizedPrompt}
        className={markdownClassName}
        backgroundColor={markdownBackgroundColor}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void state.accept()}
          aria-label="Accept optimized prompt"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-emerald-600 hover:bg-emerald-500/10"
        >
          <Check className="h-3 w-3" />
          Accept
        </button>
        <button
          type="button"
          onClick={state.dismiss}
          aria-label="Dismiss optimized prompt"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-3 w-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
