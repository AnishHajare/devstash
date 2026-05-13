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
  AuthCardShell,
  AuthWordmark,
} from "@/components/auth/auth-card-shell";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { GitHubIcon } from "@/components/auth/github-icon";
import { AuthProviderDivider } from "@/components/auth/auth-provider-divider";

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
  const isAccountNotLinked = authError === "OAuthAccountNotLinked";
  const [error, setError] = useState(
    isUnverified
      ? ""
      : isRateLimited
        ? "Too many login attempts. Please try again in 15 minutes."
        : isAccountNotLinked
          ? "An account with this email already exists. Please sign in with your password first, then link GitHub from Settings."
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
  const linked = searchParams.get("linked");
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    if (registered === "true") {
      toastShown.current = true;
      toast.success("Account created! Check your email to verify.");
    } else if (linked === "true") {
      toastShown.current = true;
      toast.success("GitHub account linked successfully!");
    }
  }, [registered, linked]);

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
    <AuthCardShell
      title="Sign in to DevStash"
      description="Enter your credentials to continue"
      headerIcon={<AuthWordmark />}
      className="w-full max-w-sm border border-border shadow-xl shadow-black/5 dark:shadow-black/30"
    >
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
          {error && <AuthFormMessage>{error}</AuthFormMessage>}

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

        <AuthProviderDivider />

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
    </AuthCardShell>
  );
}
