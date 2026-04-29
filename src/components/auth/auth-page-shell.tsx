import type { ReactNode } from "react";
import { HomepageHeader } from "@/components/homepage/homepage-header";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark relative isolate min-h-screen overflow-x-hidden bg-black text-[#f4f7ff]"
      style={{ scrollPaddingTop: 82 }}
    >
      <HomepageHeader />
      <main className="flex min-h-screen items-center justify-center px-4 pb-8 pt-[110px]">
        {children}
      </main>
    </div>
  );
}
