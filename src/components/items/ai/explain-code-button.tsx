"use client";

import { useState, useTransition } from "react";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { explainCode } from "@/actions/ai";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={state.runExplain}
      title={state.isPro ? "Explain code" : "AI features require Pro subscription"}
      aria-disabled={!state.isPro}
      className="h-7 gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground aria-disabled:opacity-60"
    >
      {state.pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          {!state.isPro && <Crown className="h-3 w-3" />}
          <Sparkles className="h-3 w-3" />
        </>
      )}
      {state.pending ? "Explaining…" : "Explain"}
    </Button>
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
