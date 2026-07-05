import type { Metadata } from "next";
import { Hero } from "@/components/marketing/sections/hero";
import { Logos } from "@/components/marketing/sections/logos";
import { Features } from "@/components/marketing/sections/features";
import { WhyDecentralized } from "@/components/marketing/sections/why-decentralized";
import { SimulationPreview } from "@/components/marketing/sections/simulation-preview";
import { AiSection } from "@/components/marketing/sections/ai-section";
import { DashboardPreview } from "@/components/marketing/sections/dashboard-preview";
import { Testimonials } from "@/components/marketing/sections/testimonials";
import { PricingPreview } from "@/components/marketing/sections/pricing-preview";
import { Faq } from "@/components/marketing/sections/faq";
import { Cta } from "@/components/marketing/sections/cta";

export const metadata: Metadata = {
  title: "ChainRoute AI — The decentralized brain for modern logistics",
  description:
    "ChainRoute AI turns every shipment event into an immutable ledger entry, predicts delays before they happen, and gives your supply chain enterprise-grade transparency.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Logos />
      <Features />
      <WhyDecentralized />
      <SimulationPreview />
      <AiSection />
      <DashboardPreview />
      <Testimonials />
      <PricingPreview />
      <Faq />
      <Cta />
    </>
  );
}
