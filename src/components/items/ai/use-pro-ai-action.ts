"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useProAiAction() {
  const router = useRouter();

  function showUpgradeToast() {
    toast.error("Upgrade to Pro to use AI features.", {
      action: {
        label: "Upgrade",
        onClick: () => router.push("/settings"),
      },
    });
  }

  function handleProActionError(error: string) {
    if (error.startsWith("Upgrade to Pro")) {
      showUpgradeToast();
      return;
    }

    toast.error(error);
  }

  return {
    showUpgradeToast,
    handleProActionError,
  };
}
