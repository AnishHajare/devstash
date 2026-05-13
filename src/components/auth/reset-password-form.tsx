"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthCardShell,
  AuthWordmark,
} from "@/components/auth/auth-card-shell";
import { AuthFormMessage } from "@/components/auth/auth-form-message";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthCardShell
        title="Invalid reset link"
        description="This password reset link is invalid or missing a token."
      >
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
          >
            Request a new link
          </Link>
      </AuthCardShell>
    );
  }

  if (success) {
    return (
      <AuthCardShell
        title="Password reset"
        description="Your password has been reset successfully. You can now sign in with your new password."
        headerIcon={
          <div className="mx-auto mb-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        }
      >
          <Link
            href="/sign-in"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
          >
            Sign in
          </Link>
      </AuthCardShell>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Both fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const minutes = Math.ceil(data.retryAfter / 60);
        setError(`Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
        return;
      }

      if (!res.ok) {
        setError(data.message ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardShell
      title="Reset your password"
      description="Enter your new password below."
      headerIcon={<AuthWordmark />}
    >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AuthFormMessage>{error}</AuthFormMessage>}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
    </AuthCardShell>
  );
}
