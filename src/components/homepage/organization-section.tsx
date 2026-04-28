import { RevealOnScroll } from "./reveal-on-scroll";

const INFO_CARDS = [
  {
    title: "Collections",
    description: "Group related resources by project, topic, or workflow.",
  },
  {
    title: "Favorites and pins",
    description: "Keep the things you reach for most close at hand.",
  },
  {
    title: "Rich item types",
    description: "Store text, links, files, images, and reusable code.",
  },
];

export function OrganizationSection() {
  return (
    <section
      id="organization"
      className="relative isolate my-[34px] overflow-hidden bg-black text-white scroll-mt-0"
    >
      <div
        className="absolute inset-0 z-0 bg-black"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid min-h-[520px] w-[min(1180px,calc(100%-40px))] grid-cols-[1fr_0.82fr] items-center gap-[60px] py-[84px] max-md:grid-cols-1">
        <RevealOnScroll>
          <p className="mb-3.5 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-[#2563eb]">
            Your stash
          </p>
          <h2 className="m-0 max-w-[760px] font-heading text-[clamp(2.1rem,4vw,4rem)] leading-[0.98] text-white">
            Organized around the way you save things.
          </h2>
          <p className="mt-[18px] max-w-[690px] text-[1.03rem] text-[#cbd5e1]">
            Keep items grouped by collection, pin what matters, and move quickly
            between snippets, prompts, commands, notes, links, files, and images.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={120} className="grid gap-3">
          {INFO_CARDS.map((card) => (
            <div
              key={card.title}
              className="grid gap-[5px] rounded-lg border border-white/12 bg-white/8 p-[18px] shadow-[0_18px_48px_rgba(0,0,0,0.18)]"
            >
              <strong className="text-white">{card.title}</strong>
              <span className="text-[#cbd5e1]">{card.description}</span>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
