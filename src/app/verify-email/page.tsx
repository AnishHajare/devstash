"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const isSuccess = status === "success";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          {isSuccess ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          ) : (
            <XCircle className="h-10 w-10 text-destructive" />
          )}
        </div>
        <CardTitle className="text-xl">
          {isSuccess ? "Email verified" : "Verification failed"}
        </CardTitle>
        <CardDescription>
          {isSuccess
            ? "Your email has been verified. You can now sign in."
            : message ?? "Something went wrong. Please try again."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium transition-all hover:bg-primary/80"
        >
          {isSuccess ? "Sign in" : "Back to sign in"}
        </Link>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
