import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";

interface Tier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
  ctaVariant: "gradient" | "clay" | "outline";
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$0",
    description: "Everything you need to explore the simulated network.",
    features: [
      "Up to 100 tracked shipments",
      "Blockchain Simulation Mode",
      "Core analytics dashboard",
      "Community support",
    ],
    cta: "Start free",
    href: "/signup",
    featured: false,
    ctaVariant: "clay",
  },
  {
    name: "Business",
    price: "$149",
    period: "/mo",
    description: "Predictive AI and full ledger for growing operations.",
    features: [
      "Unlimited shipments",
      "AI delay & risk prediction",
      "Route & warehouse optimization",
      "Transporter trust scores",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    href: "/signup",
    featured: true,
    ctaVariant: "gradient",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Dedicated scale, security and onboarding for global fleets.",
    features: [
      "SSO & advanced roles",
      "Dedicated verifier nodes",
      "Custom integrations & SLAs",
      "White-glove onboarding",
    ],
    cta: "Talk to sales",
    href: "/contact",
    featured: false,
    ctaVariant: "outline",
  },
];

export function PricingPreview() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Simple plans that <span className="text-gradient">scale with you</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Start free, upgrade when you are ready. No hidden fees, no gas, no lock-in.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <Card
                className={cn(
                  "relative flex h-full flex-col p-7",
                  tier.featured && "shadow-glow lg:-translate-y-4",
                )}
              >
                {tier.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Sparkles className="h-3.5 w-3.5" /> Most popular
                  </Badge>
                )}

                <CardHeader className="p-0">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                  {tier.period && (
                    <span className="pb-1 text-sm text-muted-foreground">{tier.period}</span>
                  )}
                </div>

                <CardContent className="flex-1 p-0 pt-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <Button
                  variant={tier.ctaVariant}
                  size="lg"
                  asChild
                  className="mt-8 w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
