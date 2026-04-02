import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/profile";
import { iconMap } from "@/lib/icon-map";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, FolderOpen, Layers, Mail } from "lucide-react";
import { getLinkedAccounts } from "@/lib/db/accounts";
import { ChangePasswordSection } from "./change-password";
import { DeleteAccountSection } from "./delete-account";
import { LinkedAccountsSection } from "./linked-accounts";

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [{ user, stats }, linkedAccounts] = await Promise.all([
    getUserProfile(session.user.id),
    getLinkedAccounts(session.user.id),
  ]);

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and settings
        </p>
      </div>

      <Separator />

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 text-2xl">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? "User"} />
              )}
              <AvatarFallback className="text-xl">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-xl font-semibold">
                {user.name ?? user.email}
              </p>
              {user.name && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member since:</span>
              <span className="font-medium">{joinDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.hasPassword && <ChangePasswordSection />}
          <LinkedAccountsSection
            linkedProviders={linkedAccounts.map((a) => a.provider)}
            hasPassword={user.hasPassword}
          />
          <DeleteAccountSection />
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Totals */}
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

          {/* Items by type */}
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
