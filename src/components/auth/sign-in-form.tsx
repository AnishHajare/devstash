"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const errorCode = searchParams.get("code");
  const isUnverified =
    authError === "CredentialsSignin" && errorCode === "EMAIL_NOT_VERIFIED";
  const isRateLimited =
    authError === "CredentialsSignin" && errorCode === "TOO_MANY_ATTEMPTS";
  const [error, setError] = useState(
    isUnverified
      ? ""
      : isRateLimited
        ? "Too many login attempts. Please try again in 15 minutes."
        : authError === "CredentialsSignin"
          ? "Invalid email or password"
          : authError
            ? "Something went wrong"
            : ""
  );
  const [loading, setLoading] = useState(false);
  const [showUnverified, setShowUnverified] = useState(isUnverified);
  const [resending, setResending] = useState(false);
  const registered = searchParams.get("registered");
  const toastShown = useRef(false);

  useEffect(() => {
    if (registered === "true" && !toastShown.current) {
      toastShown.current = true;
      toast.success("Account created! Check your email to verify.");
    }
  }, [registered]);

  async function handleResendVerification() {
    if (!email) {
      setError("Enter your email above, then click resend.");
      return;
    }
    setResending(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);

    if (res.status === 429) {
      const data = await res.json();
      const minutes = Math.ceil(data.retryAfter / 60);
      toast.error(`Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
      return;
    }

    setShowUnverified(false);
    toast.success("Verification email sent! Check your inbox.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl,
      });
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          DS
        </div>
        <CardTitle className="text-xl">Sign in to DevStash</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showUnverified && (
            <div className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
              <p>Your email is not verified. Check your inbox or resend the link.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-1 font-medium underline underline-offset-4 hover:text-amber-400 disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
            </div>
          )}
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => signIn("github", { redirectTo: callbackUrl })}
        >
          <GitHubIcon className="h-4 w-4" />
          Sign in with GitHub
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
