"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodeJwt } from "jose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { GitHubIcon } from "@/components/auth/github-icon";

type TokenPayload = {
  email?: string;
  provider?: string;
};

export function LinkAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const payload = useMemo<TokenPayload | null>(() => {
    if (!token) return null;
    try {
      return decodeJwt(token) as TokenPayload;
    } catch {
      return null;
    }
  }, [token]);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !payload?.email) {
    return (
      <AuthCardShell
        title="Invalid or Expired Link"
        description="This account linking link is invalid or has expired. Please try signing in with GitHub again."
      >
          <Link
            href="/sign-in"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
          >
            Back to sign in
          </Link>
      </AuthCardShell>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const minutes = Math.ceil(data.retryAfter / 60);
        setError(
          `Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Account linked — sign in with credentials
      await signIn("credentials", {
        email: payload!.email,
        password,
        redirectTo: "/dashboard",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const providerName =
    payload.provider === "github" ? "GitHub" : payload.provider ?? "OAuth";

  return (
    <AuthCardShell
      title={`Link your ${providerName} account`}
      description={
        <>
          A DevStash account already exists for{" "}
          <span className="font-medium text-foreground">{payload.email}</span>.
          Enter your password to link {providerName}.
        </>
      }
      headerIcon={
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GitHubIcon className="h-5 w-5" />
        </div>
      }
    >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthFormMessage>{error}</AuthFormMessage>}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your DevStash password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Linking…" : "Link Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Cancel
          </Link>
        </p>
    </AuthCardShell>
  );
}
