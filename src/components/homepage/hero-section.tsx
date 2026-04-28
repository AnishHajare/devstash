import Link from "next/link";
import { RevealOnScroll } from "./reveal-on-scroll";

export function HeroSection() {
  return (
    <section className="flex min-h-[108vh] items-center justify-center px-0 pt-[132px] pb-[84px] text-center max-md:min-h-auto max-md:pt-[130px]">
      <RevealOnScroll className="flex w-[min(100%,820px)] flex-col items-center">
        <p className="mb-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
          Personal knowledge hub for developers
        </p>
        <h1 className="m-0 max-w-[760px] font-heading text-[clamp(2.85rem,5vw,4.7rem)] font-semibold leading-[0.96] text-[#f4f7ff] max-sm:text-[clamp(2.35rem,10vw,3.2rem)]">
          Keep your developer knowledge in one searchable stash.
        </h1>
        <p className="mt-[22px] max-w-[620px] text-[clamp(1.04rem,1.5vw,1.22rem)] leading-[1.65] text-[#9aa3b7]">
          Save snippets, prompts, commands, notes, links, and files in collections
          so the resources you reuse are easy to find when you need them.
        </p>
        <div className="mt-[30px] flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/18 bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-[18px] font-bold text-white shadow-[0_18px_44px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-[3px] hover:shadow-[0_20px_44px_rgba(37,99,235,0.35)]"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/16 bg-white/8 px-[18px] font-bold text-[#f8fafc] transition-all hover:-translate-y-[3px]"
          >
            See Features
          </a>
        </div>
      </RevealOnScroll>
    </section>
  );
}
