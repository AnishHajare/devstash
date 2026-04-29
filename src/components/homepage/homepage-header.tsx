"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function HomepageHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-20 w-full border-b border-white/12 bg-[rgba(8,9,15,0.94)] backdrop-blur-[18px]">
      <div className="mx-auto grid min-h-[78px] w-[min(1180px,calc(100%-40px))] grid-cols-[auto_1fr_auto] items-center max-md:grid-cols-[auto_1fr_auto]">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-heading text-[1.08rem] font-semibold tracking-[-0.01em]"
          aria-label="DevStash home"
        >
          <svg
            className="h-[34px] w-[34px]"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="logoGradient" x1="4" y1="12" x2="60" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path
              d="M4 16 Q4 12 8 12 L24 12 L30 18 L56 18 Q60 18 60 22 L60 50 Q60 54 56 54 L8 54 Q4 54 4 50Z"
              className="fill-[url(#logoGradient)]"
            />
          </svg>
          <span>DevStash</span>
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
