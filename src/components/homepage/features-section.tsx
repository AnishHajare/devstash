import { RevealOnScroll } from "./reveal-on-scroll";

const FEATURES = [
  {
    title: "Code Snippets",
    description: "Save reusable code with syntax highlighting, language detection, and instant copy.",
    iconColor: "text-[#60a5fa] border-[rgba(96,165,250,0.12)] bg-[rgba(37,99,235,0.18)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="m8 9-4 3 4 3" />
        <path d="m16 9 4 3-4 3" />
        <path d="m14 5-4 14" />
      </svg>
    ),
  },
  {
    title: "AI Prompts",
    description: "Store and organize your best prompts for ChatGPT, Claude, and other AI tools.",
    iconColor: "text-[#fbbf24] border-[rgba(251,191,36,0.14)] bg-[rgba(217,119,6,0.2)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M12 3 13.6 8.2 19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z" />
        <path d="M19 15.5 19.8 18l2.2.8-2.2.8L19 22l-.8-2.4-2.2-.8 2.2-.8.8-2.5Z" />
      </svg>
    ),
  },
  {
    title: "Instant Search",
    description: "Find anything by content, tags, title, or type without digging through folders.",
    iconColor: "text-[#22d3ee] border-[rgba(34,211,238,0.14)] bg-[rgba(8,145,178,0.2)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    ),
  },
  {
    title: "Commands",
    description: "Keep your most-used terminal commands at your fingertips.",
    iconColor: "text-[#4ade80] border-[rgba(74,222,128,0.14)] bg-[rgba(22,163,74,0.18)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="m5 8 4 4-4 4" />
        <path d="M12 16h7" />
      </svg>
    ),
  },
  {
    title: "Files & Docs",
    description: "Upload and manage files, images, and documents alongside your notes.",
    iconColor: "text-[#94a3b8] border-[rgba(148,163,184,0.16)] bg-[rgba(71,85,105,0.22)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M7 3h7l4 4v14H7V3Z" />
        <path d="M14 3v5h5" />
        <path d="M10 13h6" />
        <path d="M10 17h6" />
      </svg>
    ),
  },
  {
    title: "Collections",
    description: "Group related items by project, topic, or workflow for quick access.",
    iconColor: "text-[#818cf8] border-[rgba(129,140,248,0.16)] bg-[rgba(79,70,229,0.2)]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M3 7h7l2 2h9v9.5A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5V7Z" />
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-[min(1180px,calc(100%-40px))] pt-[92px] pb-[116px] max-sm:py-[80px] scroll-mt-0">
      <RevealOnScroll className="mx-auto mb-[42px] max-w-[820px] text-center">
        <h2 className="mx-auto max-w-[760px] font-heading text-[clamp(2.1rem,4vw,4rem)] leading-[0.98] text-[#f6f7ff]">
          Everything You Need,<br />
          <span className="text-[#2563eb]">One Place</span>
        </h2>
        <p className="mx-auto mt-[18px] max-w-[690px] text-[1.03rem] text-[#8f96aa]">
          Save the snippets, prompts, commands, notes, links, files, and images
          you reuse. Organize them into collections and find them again fast.
        </p>
      </RevealOnScroll>

      <div className="grid grid-cols-3 gap-x-6 gap-y-7 max-md:grid-cols-2 max-sm:grid-cols-1">
        {FEATURES.map((feature) => (
          <RevealOnScroll key={feature.title}>
            <article className="hoverable min-h-[214px] rounded-lg border border-white/10 bg-[rgba(18,19,29,0.76)] p-[26px] shadow-[0_18px_56px_rgba(0,0,0,0.18)] backdrop-blur-[20px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(37,99,235,0.46)] hover:shadow-[0_26px_70px_rgba(0,0,0,0.28)] max-sm:min-h-0">
              <span className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border ${feature.iconColor}`}>
                {feature.icon}
              </span>
              <h3 className="font-heading text-[1.18rem] leading-[1.2] text-[#f4f7ff]">
                {feature.title}
              </h3>
              <p className="mb-0 text-[#949bb0]">{feature.description}</p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
