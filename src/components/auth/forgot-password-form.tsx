"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthCardShell,
  AuthWordmark,
} from "@/components/auth/auth-card-shell";
import { AuthFormMessage } from "@/components/auth/auth-form-message";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const minutes = Math.ceil(data.retryAfter / 60);
        setError(`Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Something went wrong.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCardShell
        title="Check your email"
        description={
          <>
            If an account exists for {email}, you&apos;ll receive a password
            reset link shortly.
          </>
        }
        headerIcon={
          <div className="mx-auto mb-2">
            <Mail className="h-10 w-10 text-muted-foreground" />
          </div>
        }
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

  return (
    <AuthCardShell
      title="Forgot your password?"
      description="Enter your email and we&apos;ll send you a reset link."
      headerIcon={<AuthWordmark />}
    >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
    </AuthCardShell>
  );
}
