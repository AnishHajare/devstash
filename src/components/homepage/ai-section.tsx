"use client";

import { useEffect, useRef } from "react";
import { RevealOnScroll } from "./reveal-on-scroll";

const TYPED_LINES = [
  "result.explanation",
  "// Explains the saved snippet in plain language",
  "// and suggests tags for faster retrieval.",
];

export function AiSection() {
  const typingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = typingRef.current;
    if (!el) return;

    const text = TYPED_LINES.join("\n");
    let index = 0;
    let timerId: ReturnType<typeof setTimeout>;

    function type() {
      if (!el) return;
      el.textContent = text.slice(0, index);
      index = (index + 1) % (text.length + 52);
      timerId = setTimeout(type, index > text.length ? 42 : 34);
    }

    type();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <section id="ai" className="mx-auto w-[min(1180px,calc(100%-40px))] py-[116px] max-sm:py-[80px] scroll-mt-0">
      <RevealOnScroll className="mx-auto mb-[42px] max-w-[820px] text-center">
        <p className="mb-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
          Pro AI tools
        </p>
        <h2 className="m-0 max-w-[760px] font-heading text-[clamp(2.1rem,4vw,4rem)] leading-[0.98] text-[#f4f7ff]">
          Make saved knowledge easier to reuse.
        </h2>
        <p className="mx-auto mt-[18px] max-w-[690px] text-[1.03rem] text-[#9aa3b7]">
          Use AI to suggest tags, summarize saved items, explain code snippets,
          and refine prompts without leaving your stash.
        </p>
      </RevealOnScroll>

      <RevealOnScroll>
        <div className="hoverable grid grid-cols-[minmax(0,1fr)_280px] overflow-hidden rounded-lg border border-white/10 bg-[#0f172a] shadow-[0_18px_56px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(37,99,235,0.46)] hover:shadow-[0_26px_70px_rgba(0,0,0,0.28)] max-md:grid-cols-1">
          {/* Editor top bar */}
          <div className="col-span-full flex min-h-[48px] items-center gap-2 border-b border-white/8 px-[18px]">
            <span className="h-2.5 w-2.5 rounded-full bg-white/28" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/28" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/28" />
            <p className="m-0 ml-2 text-[0.86rem] leading-none text-[#cbd5e1]">ai-tools.ts</p>
          </div>

          {/* Code area */}
          <pre className="m-0 min-h-[430px] overflow-auto p-[30px] font-mono text-[0.98rem] font-medium leading-[1.8] text-[#e2e8f0] max-sm:min-h-[360px] max-sm:p-[22px] max-sm:text-[0.85rem]">
            <code className="whitespace-pre-wrap">
              <span className="text-[#93a4ba]">const</span> result ={" "}
              <span className="text-[#7dd3fc]">await</span> devstash.ai.explain({"{"}
              {"\n"}  itemType: <span className="text-[#c4b5fd]">&quot;snippet&quot;</span>,
              {"\n"}  language: <span className="text-[#c4b5fd]">&quot;typescript&quot;</span>,
              {"\n"}  includeTags: <span className="text-[#7dd3fc]">true</span>
              {"\n"}{"}"})
              {"\n\n"}
              <span ref={typingRef} className="homepage-typing-caret" />
            </code>
          </pre>

          {/* Citation sidebar */}
          <aside
            className="grid content-start gap-3 border-l border-white/8 bg-white/4 p-[30px_24px] max-md:border-l-0 max-md:border-t max-md:border-white/8"
            aria-label="Cited sources"
          >
            {[
              "Suggested tags from item content",
              "Plain-language code explanation",
              "Prompt rewrite for clearer output",
            ].map((text) => (
              <a
                key={text}
                href="#features"
                className="rounded-lg border border-[rgba(125,211,252,0.18)] bg-[rgba(37,99,235,0.12)] p-3.5 text-[0.9rem] leading-[1.45] text-[#dbeafe] transition-colors hover:border-[rgba(125,211,252,0.36)]"
              >
                {text}
              </a>
            ))}
          </aside>
        </div>
      </RevealOnScroll>
    </section>
  );
}
