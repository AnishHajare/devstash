import Link from "next/link";
import { RevealOnScroll } from "./reveal-on-scroll";

export function CtaSection() {
  return (
    <RevealOnScroll className="mx-auto mb-12 w-[min(1180px,calc(100%-40px))] rounded-lg border border-[rgba(37,99,235,0.28)] bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(124,58,237,0.12)),rgba(18,19,29,0.86)] px-[clamp(22px,5vw,72px)] py-[74px] text-center">
      <p className="mb-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
        DevStash
      </p>
      <h2 className="mx-auto mb-7 max-w-[760px] font-heading text-[clamp(2.1rem,4vw,4rem)] leading-[0.98] text-[#f4f7ff]">
        Give your reusable developer knowledge one permanent home.
      </h2>
      <Link
        href="/register"
        className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/18 bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-[18px] font-bold text-white shadow-[0_18px_44px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-[3px] hover:shadow-[0_20px_44px_rgba(37,99,235,0.35)]"
      >
        Start building
      </Link>
    </RevealOnScroll>
  );
}
