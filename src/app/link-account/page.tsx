import { Suspense } from "react";
import { LinkAccountForm } from "@/components/auth/link-account-form";

export const metadata = {
  title: "Link Account — DevStash",
};

export default function LinkAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LinkAccountForm />
      </Suspense>
    </div>
  );
}
