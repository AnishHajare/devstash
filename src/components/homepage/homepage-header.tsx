"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { DevstashLogo } from "@/components/brand/devstash-logo";

export function HomepageHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-20 w-full border-b border-white/12 bg-[rgba(8,9,15,0.94)] backdrop-blur-[18px]">
      <div className="mx-auto grid min-h-[78px] w-[min(1180px,calc(100%-40px))] grid-cols-[auto_1fr_auto] items-center max-md:grid-cols-[auto_1fr_auto]">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center text-white"
          aria-label="DevStash home"
        >
          <DevstashLogo variant="lockup" size={26} label="DevStash home" />
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="flex justify-center gap-[clamp(18px,3vw,34px)] text-[#c8cfdf] text-[0.92rem] font-semibold max-md:hidden" aria-label="Primary navigation">
          <Link href="/#features" className="transition-colors hover:text-white">Features</Link>
          <Link href="/#pricing" className="transition-colors hover:text-white">Pricing</Link>
        </nav>

        {/* Spacer for mobile grid balance */}
        <div className="md:hidden" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center h-9 px-4 text-[0.85rem] text-[#c8cfdf] border border-white/10 bg-white/5 rounded-full font-semibold transition-all hover:text-white hover:border-white/20 hover:bg-white/8 max-md:hidden"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-9 px-4 text-[0.85rem] text-white rounded-full font-semibold bg-gradient-to-r from-[#2563eb] to-[#06b6d4] border border-white/18 transition-all hover:shadow-[0_8px_24px_rgba(37,99,235,0.3)] max-md:hidden"
          >
            Start free
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#c8cfdf] transition-colors hover:text-white hover:bg-white/8"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-white/8 bg-[rgba(8,9,15,0.97)] backdrop-blur-[18px]"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex w-[min(1180px,calc(100%-40px))] flex-col gap-1 py-4">
            <Link
              href="/#features"
              className="rounded-lg px-3 py-2.5 text-[0.92rem] font-semibold text-[#c8cfdf] transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="rounded-lg px-3 py-2.5 text-[0.92rem] font-semibold text-[#c8cfdf] transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <div className="my-2 border-t border-white/8" />
            <div className="flex flex-col gap-2 px-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center h-9 px-4 text-[0.85rem] text-[#c8cfdf] border border-white/10 bg-white/5 rounded-full font-semibold transition-all hover:text-white hover:border-white/20 hover:bg-white/8"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-9 px-4 text-[0.85rem] text-white rounded-full font-semibold bg-gradient-to-r from-[#2563eb] to-[#06b6d4] border border-white/18 transition-all hover:shadow-[0_8px_24px_rgba(37,99,235,0.3)]"
                onClick={() => setMobileOpen(false)}
              >
                Start free
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
