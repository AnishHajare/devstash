"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BillingSectionProps = {
  isPro: boolean;
  hasBillingAccount: boolean;
  itemCount: number;
  collectionCount: number;
  itemLimit: number;
  collectionLimit: number;
};

type BillingAction = "monthly" | "annual" | "portal";
type UsageKind = "items" | "collections";

const USAGE_BAR_COLORS = {
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
} as const;

function getUsageColor(kind: UsageKind, value: number, limit?: number) {
  if (!limit) return USAGE_BAR_COLORS.green;

  if (kind === "collections") {
    if (value >= limit) return USAGE_BAR_COLORS.red;
    if (value >= limit - 1) return USAGE_BAR_COLORS.orange;
    if (value >= Math.max(1, limit - 2)) return USAGE_BAR_COLORS.amber;
    return USAGE_BAR_COLORS.green;
  }

  const percent = value / limit;
  if (percent >= 0.9) return USAGE_BAR_COLORS.red;
  if (percent >= 0.8) return USAGE_BAR_COLORS.orange;
  if (percent >= 0.6) return USAGE_BAR_COLORS.amber;
  return USAGE_BAR_COLORS.green;
}

async function readCheckoutUrl(response: Response): Promise<string> {
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Unable to open billing");
  }
  return data.url;
}

export function BillingSection({
  isPro,
  hasBillingAccount,
  itemCount,
  collectionCount,
  itemLimit,
  collectionLimit,
}: BillingSectionProps) {
  const [pendingAction, setPendingAction] = useState<BillingAction | null>(null);

  async function startCheckout(plan: "monthly" | "annual") {
    setPendingAction(plan);
    try {
      const url = await readCheckoutUrl(
        await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        })
      );
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start checkout");
      setPendingAction(null);
    }
  }

  async function openPortal() {
    setPendingAction("portal");
    try {
      const url = await readCheckoutUrl(
        await fetch("/api/stripe/portal", { method: "POST" })
      );
      window.location.assign(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open billing");
      setPendingAction(null);
    }
  }

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Pro plan active
            </div>
            <p className="text-sm text-muted-foreground">
              Files, images, higher limits, and upcoming Pro features are enabled.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openPortal}
            disabled={!hasBillingAccount || pendingAction === "portal"}
            className="w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4" />
            {pendingAction === "portal" ? "Opening..." : "Manage Subscription"}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageStat
            kind="items"
            label="Items"
            value={itemCount}
            limitLabel="Unlimited"
          />
          <UsageStat
            kind="collections"
            label="Collections"
            value={collectionCount}
            limitLabel="Unlimited"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Free plan
        </div>
        <p className="text-sm text-muted-foreground">
          You can save up to {itemLimit} items and {collectionLimit} collections
          before upgrading to Pro.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <UsageStat
          kind="items"
          label="Items"
          value={itemCount}
          limit={itemLimit}
        />
        <UsageStat
          kind="collections"
          label="Collections"
          value={collectionCount}
          limit={collectionLimit}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          onClick={() => startCheckout("monthly")}
          disabled={pendingAction !== null}
          className="w-full"
        >
          <CreditCard className="h-4 w-4" />
          {pendingAction === "monthly" ? "Opening..." : "Upgrade - $8/mo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => startCheckout("annual")}
          disabled={pendingAction !== null}
          className="w-full"
        >
          <ExternalLink className="h-4 w-4" />
          {pendingAction === "annual"
            ? "Opening..."
            : "Upgrade - $72/yr (save 25%)"}
        </Button>
      </div>
    </div>
  );
}

function UsageStat({
  kind,
  label,
  value,
  limit,
  limitLabel,
}: {
  kind: UsageKind;
  label: string;
  value: number;
  limit?: number;
  limitLabel?: string;
}) {
  const percent = limit ? Math.min(100, Math.round((value / limit) * 100)) : 100;
  const barColor = getUsageColor(kind, value, limit);

  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {limit ? `${value}/${limit}` : `${value} / ${limitLabel}`}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-colors ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
