"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitHubIcon } from "@/components/auth/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Link2, Link2Off, ShieldCheck } from "lucide-react";

type LinkedAccountsSectionProps = {
  linkedProviders: string[];
  hasPassword: boolean;
};

export function LinkedAccountsSection({
  linkedProviders,
  hasPassword,
}: LinkedAccountsSectionProps) {
  const router = useRouter();
  const isGitHubLinked = linkedProviders.includes("github");
  const [unlinking, setUnlinking] = useState(false);

  async function handleUnlink() {
    setUnlinking(true);
    try {
      const res = await fetch("/api/profile/linked-accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "github" }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const minutes = Math.ceil(data.retryAfter / 60);
        toast.error(
          `Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`
        );
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to unlink account.");
        return;
      }

      toast.success("GitHub account unlinked.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Sign-in Methods
        </p>
        <p className="text-sm text-muted-foreground">
          Manage how you access your account today and prepare for more
          providers later.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Email and password</p>
                <Badge variant={hasPassword ? "outline" : "secondary"}>
                  {hasPassword ? "Connected" : "Not set"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {hasPassword
                  ? "Use your password to sign in and manage linked providers."
                  : "Set a password to unlock email sign-in and safer provider management."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <GitHubIcon className="h-5 w-5" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">GitHub</p>
                <Badge variant={isGitHubLinked ? "outline" : "secondary"}>
                  {isGitHubLinked ? "Connected" : "Available"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isGitHubLinked
                  ? "Use GitHub as a linked sign-in method for faster access."
                  : "Connect GitHub to sign in with OAuth in addition to your password."}
              </p>
            </div>
          </div>

          {isGitHubLinked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinking || !hasPassword}
              title={
                !hasPassword
                  ? "Set a password first to unlink GitHub"
                  : undefined
              }
              className="gap-1.5"
            >
              <Link2Off className="h-3.5 w-3.5" />
              {unlinking ? "Unlinking..." : "Unlink"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signIn("github", { redirectTo: "/settings" })}
              className="gap-1.5"
            >
              <Link2 className="h-3.5 w-3.5" />
              Connect GitHub
            </Button>
          )}
        </div>
      </div>

      {isGitHubLinked && !hasPassword && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Add a password in the Security section before unlinking GitHub so you
          do not lose access to your account.
        </p>
      )}
    </div>
  );
}
