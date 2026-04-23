import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/profile";
import { iconMap } from "@/lib/icon-map";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Layers, Settings } from "lucide-react";
import { AccountDetailsCard } from "@/components/account/account-details-card";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { user, stats } = await getUserProfile(session.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A clean, read-only summary of who you are in DevStash.
          </p>
        </div>
        <Link
          href="/settings"
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          )}
        >
          <Settings className="h-4 w-4" />
          Open Settings
        </Link>
      </div>

      <Separator />

      <AccountDetailsCard
        user={user}
        title="Profile Overview"
        description="Identity details live here. Sign-in controls, security, and future preferences live in Settings."
      />

      <Card>
        <CardHeader>
          <CardTitle>Activity Snapshot</CardTitle>
          <CardDescription>
            A quick look at how you are using your workspace right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">
                  {stats.totalCollections}
                </p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Items by Type</p>
            <div className="grid grid-cols-2 gap-2">
              {stats.itemsByType.map((type) => {
                const Icon = iconMap[type.icon];
                return (
                  <div
                    key={type.name}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm"
                  >
                    {Icon && (
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: type.color }}
                      />
                    )}
                    <span className="capitalize">{type.name}s</span>
                    <span className="ml-auto tabular-nums font-semibold">
                      {type.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
