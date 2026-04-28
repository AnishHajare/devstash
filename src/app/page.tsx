import { CloudBackground } from "@/components/homepage/cloud-background";
import { HomepageHeader } from "@/components/homepage/homepage-header";
import { HeroSection } from "@/components/homepage/hero-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { AiSection } from "@/components/homepage/ai-section";
import { OrganizationSection } from "@/components/homepage/organization-section";
import { PricingSection } from "@/components/homepage/pricing-section";
import { CtaSection } from "@/components/homepage/cta-section";

export default function Home() {
  return (
    <div
      className="relative isolate min-h-screen overflow-x-hidden scroll-smooth text-[#f4f7ff]"
      style={{
        scrollPaddingTop: 82,
        background: "#000000",
      }}
    >
      <CloudBackground />
      <HomepageHeader />
      <main id="top">
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <OrganizationSection />
        <PricingSection />
        <CtaSection />
      </main>
    </div>
  );
}
