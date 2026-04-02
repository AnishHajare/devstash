"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decodeJwt } from "jose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

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
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid or Expired Link</CardTitle>
          <CardDescription>
            This account linking link is invalid or has expired. Please try
            signing in with GitHub again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/sign-in"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
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
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GitHubIcon className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Link your {providerName} account</CardTitle>
        <CardDescription>
          A DevStash account already exists for{" "}
          <span className="font-medium text-foreground">{payload.email}</span>.
          Enter your password to link {providerName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

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
      </CardContent>
    </Card>
  );
}
