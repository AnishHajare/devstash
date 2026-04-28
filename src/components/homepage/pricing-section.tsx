import Link from "next/link";
import { RevealOnScroll } from "./reveal-on-scroll";

const FREE_FEATURES = [
  { text: "50 items", included: true },
  { text: "3 collections", included: true },
  { text: "Snippets, prompts, commands, notes, and links", included: true },
  { text: "Basic search", included: true },
  { text: "File and image uploads", included: false },
  { text: "AI features", included: false },
];

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "All item types including files and images",
  "AI auto-tagging and summaries",
  "Explain This Code",
  "AI Prompt Optimizer",
  "Data export in JSON or ZIP",
];

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto w-[min(1180px,calc(100%-40px))] py-[116px] max-sm:py-[80px] scroll-mt-0">
      <RevealOnScroll className="mx-auto mb-[42px] max-w-[820px] text-center">
        <p className="mb-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
          Pricing
        </p>
        <h2 className="m-0 max-w-[760px] font-heading text-[clamp(2.1rem,4vw,4rem)] leading-[0.98] text-[#f4f7ff]">
          Start free. Upgrade when your stash grows.
        </h2>
        <p className="mx-auto mt-[18px] max-w-[690px] text-[1.03rem] text-[#9aa3b7]">
          Two clear plans for saving, organizing, and searching your developer resources.
        </p>
      </RevealOnScroll>

      <div className="mx-auto grid max-w-[860px] grid-cols-2 items-stretch gap-6 max-md:max-w-[560px] max-md:grid-cols-1">
        {/* Free card */}
        <RevealOnScroll>
          <article className="hoverable flex min-h-[500px] flex-col rounded-lg border border-white/10 bg-[rgba(18,19,29,0.76)] p-[34px] shadow-[0_18px_56px_rgba(0,0,0,0.18)] backdrop-blur-[20px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(37,99,235,0.46)] hover:shadow-[0_26px_70px_rgba(0,0,0,0.28)]">
            <h3 className="font-heading text-[1.18rem] leading-[1.2] text-[#f4f7ff]">Free</h3>
            <p className="mt-6 font-heading text-[clamp(3.2rem,6vw,4.5rem)] font-bold leading-none text-[#f4f7ff]">
              $0<span className="font-sans text-[0.98rem] font-semibold text-[#9aa3b7]">/month</span>
            </p>
            <p className="text-[#9aa3b7]">
              Perfect for getting started with a focused personal stash.
            </p>

            <ul className="mt-[30px] mb-[34px] grid gap-[13px] p-0 text-[#9aa3b7] list-none">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-2.5">
                  {f.included ? (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#06b6d4] shadow-[0_0_0_5px_rgba(6,182,212,0.12)]" />
                  ) : (
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 text-[#8792a5]"
                      style={{
                        background:
                          "linear-gradient(45deg, transparent 42%, #8792a5 42%, #8792a5 58%, transparent 58%), linear-gradient(-45deg, transparent 42%, #8792a5 42%, #8792a5 58%, transparent 58%)",
                      }}
                    />
                  )}
                  <span className={f.included ? "" : "text-[#8792a5]"}>{f.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-auto inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/16 bg-white/8 px-[18px] font-bold text-[#f8fafc] transition-all hover:-translate-y-[3px]"
            >
              Get started
            </Link>
          </article>
        </RevealOnScroll>

        {/* Pro card */}
        <RevealOnScroll delay={120}>
          <article className="hoverable relative flex min-h-[500px] flex-col rounded-lg border border-white/14 bg-[rgba(18,19,29,0.76)] p-[34px] shadow-[0_18px_56px_rgba(0,0,0,0.18)] backdrop-blur-[20px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(37,99,235,0.46)] hover:shadow-[0_26px_70px_rgba(0,0,0,0.28)]">
            <div className="absolute top-[22px] right-[22px] rounded-full border border-[rgba(192,132,252,0.28)] bg-[rgba(192,132,252,0.12)] px-2.5 py-[7px] text-[0.75rem] font-extrabold text-[#2563eb]">
              Most popular
            </div>
            <h3 className="font-heading text-[1.18rem] leading-[1.2] text-[#f4f7ff]">Pro</h3>
            <p className="mt-6 font-heading text-[clamp(3.2rem,6vw,4.5rem)] font-bold leading-none text-[#f4f7ff]">
              $8<span className="font-sans text-[0.98rem] font-semibold text-[#9aa3b7]">/month</span>
            </p>
            <p className="text-[#9aa3b7]">
              For serious developers who want everything searchable and enriched.
            </p>

            <ul className="mt-[30px] mb-[34px] grid gap-[13px] p-0 text-[#9aa3b7] list-none">
              {PRO_FEATURES.map((text) => (
                <li key={text} className="flex items-center gap-2.5">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#06b6d4] shadow-[0_0_0_5px_rgba(6,182,212,0.12)]" />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-auto inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/18 bg-gradient-to-r from-[#2563eb] to-[#06b6d4] px-[18px] font-bold text-white shadow-[0_18px_44px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-[3px] hover:shadow-[0_20px_44px_rgba(37,99,235,0.35)]"
            >
              Start free trial
            </Link>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  );
}
