"use client";

import { useState, useTransition } from "react";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { explainCode } from "@/actions/ai";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UseCodeExplanationContext = {
  itemId: string;
  isPro: boolean;
};

export type CodeExplanationState = {
  explanation: string | null;
  pending: boolean;
  isPro: boolean;
  view: "code" | "explain";
  setView: (view: "code" | "explain") => void;
  runExplain: () => void;
};

export function useCodeExplanation(
  ctx: UseCodeExplanationContext
): CodeExplanationState {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [view, setView] = useState<"code" | "explain">("code");

  function showUpgradeToast() {
    toast.error("Upgrade to Pro to use AI features.", {
      action: {
        label: "Upgrade",
        onClick: () => router.push("/settings"),
      },
    });
  }

  function runExplain() {
    if (!ctx.isPro) {
      showUpgradeToast();
      return;
    }

    startTransition(async () => {
      const result = await explainCode({ itemId: ctx.itemId });

      if (!result.success) {
        if (result.error.startsWith("Upgrade to Pro")) {
          showUpgradeToast();
        } else {
          toast.error(result.error);
        }
        return;
      }

      setExplanation(result.data.explanation);
      setView("explain");
    });
  }

  return {
    explanation,
    pending,
    isPro: ctx.isPro,
    view,
    setView,
    runExplain,
  };
}

export function ExplainCodeButton({
  state,
}: {
  state: Pick<CodeExplanationState, "pending" | "isPro" | "runExplain">;
}) {
  const button = (
    <button
      type="button"
      onClick={state.runExplain}
      title={state.isPro ? "Explain code" : "AI features require Pro subscription"}
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
      <span>{state.pending ? "Explaining…" : "Explain"}</span>
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
