import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Sign In — DevStash",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
