import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Sign In — DevStash",
};

export default function SignInPage() {
  return (
    <AuthPageShell>
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthPageShell>
  );
}
