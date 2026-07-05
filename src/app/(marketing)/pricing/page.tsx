"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "annual";

interface TierFeature {
  text: string;
  included: boolean;
}

interface Tier {
  id: string;
  name: string;
  tagline: string;
  monthly: number | null; // null = custom pricing
  annual: number | null; // per-month price when billed annually
  cta: { label: string; href: string };
  highlighted: boolean;
  features: TierFeature[];
}

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For small teams putting their first shipments on-chain.",
    monthly: 0,
    annual: 0,
    cta: { label: "Start free", href: "/signup" },
    highlighted: false,
    features: [
      { text: "Up to 200 shipments / month", included: true },
      { text: "3 ledger verification nodes", included: true },
      { text: "Core AI delay alerts", included: true },
      { text: "3 team seats", included: true },
      { text: "Community support", included: true },
      { text: "REST & webhook API access", included: false },
      { text: "Custom SLA & onboarding", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For growing operators scaling multi-modal networks.",
    monthly: 149,
    annual: 119,
    cta: { label: "Start free trial", href: "/signup" },
    highlighted: true,
    features: [
      { text: "Up to 10,000 shipments / month", included: true },
      { text: "25 ledger verification nodes", included: true },
      { text: "Predictive AI insights & forecasting", included: true },
      { text: "25 team seats", included: true },
      { text: "Priority support · 4h response SLA", included: true },
      { text: "Full REST & webhook API access", included: true },
      { text: "Custom SLA & onboarding", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For global supply chains that run mission-critical freight.",
    monthly: null,
    annual: null,
    cta: { label: "Talk to sales", href: "/contact" },
    highlighted: false,
    features: [
      { text: "Unlimited shipments", included: true },
      { text: "Unlimited ledger nodes + private chain", included: true },
      { text: "Custom-tuned AI & anomaly models", included: true },
      { text: "Unlimited seats & SSO/SAML", included: true },
      { text: "Dedicated CSM · 1h response SLA", included: true },
      { text: "API + private-cloud & on-prem deploy", included: true },
      { text: "Custom SLA & white-glove onboarding", included: true },
    ],
  },
];

interface ComparisonRow {
  feature: string;
  values: [React.ReactNode, React.ReactNode, React.ReactNode];
}

function Yes() {
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-success/15 text-success">
      <Check className="h-4 w-4" aria-label="Included" />
    </span>
  );
}

function No() {
  return (
    <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-muted text-muted-foreground/70">
      <Minus className="h-4 w-4" aria-label="Not included" />
    </span>
  );
}

const COMPARISON: ComparisonRow[] = [
  {
    feature: "Shipments per month",
    values: ["200", "10,000", "Unlimited"],
  },
  {
    feature: "Ledger verification nodes",
    values: ["3", "25", "Unlimited"],
  },
  {
    feature: "Team seats",
    values: ["3", "25", "Unlimited"],
  },
  {
    feature: "AI delay prediction",
    values: [<Yes key="s" />, <Yes key="b" />, <Yes key="e" />],
  },
  {
    feature: "Predictive forecasting & anomaly detection",
    values: [<No key="s" />, <Yes key="b" />, <Yes key="e" />],
  },
  {
    feature: "Route optimization engine",
    values: [<No key="s" />, <Yes key="b" />, <Yes key="e" />],
  },
  {
    feature: "REST & webhook API access",
    values: [<No key="s" />, <Yes key="b" />, <Yes key="e" />],
  },
  {
    feature: "Custom-tuned AI models",
    values: [<No key="s" />, <No key="b" />, <Yes key="e" />],
  },
  {
    feature: "SSO / SAML & audit logs",
    values: [<No key="s" />, <No key="b" />, <Yes key="e" />],
  },
  {
    feature: "Private-cloud & on-prem deploy",
    values: [<No key="s" />, <No key="b" />, <Yes key="e" />],
  },
  {
    feature: "Support",
    values: ["Community", "Priority · 4h SLA", "Dedicated · 1h SLA"],
  },
];

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "How does annual billing work?",
    a: "Choose annual and you're billed once for twelve months at roughly 20% less than the monthly rate. The per-month price shown on each plan reflects that discount.",
  },
  {
    q: "What counts as a shipment?",
    a: "Any tracked consignment you create in ChainRoute, from origin scan to final delivery. Simulated and test shipments never count toward your monthly limit.",
  },
  {
    q: "Can I change or cancel my plan later?",
    a: "Yes. Upgrade, downgrade, or cancel at any time from your billing settings. Upgrades apply instantly and we prorate the difference; downgrades take effect at your next renewal.",
  },
  {
    q: "Do you offer discounts for startups or non-profits?",
    a: "We do. Qualifying early-stage startups and registered non-profits get up to 50% off the Business plan for the first year. Reach out through the contact page to apply.",
  },
];

function formatTierPrice(tier: Tier, period: BillingPeriod): string {
  const value = period === "annual" ? tier.annual : tier.monthly;
  if (value === null) return "Custom";
  if (value === 0) return "$0";
  return `$${value}`;
}

export default function PricingPage() {
  const [period, setPeriod] = React.useState<BillingPeriod>("monthly");
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  return (
    <div className="bg-mesh pb-24 pt-32">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Pricing that scales with your{" "}
            <span className="text-gradient">supply chain</span>
          </h1>
          <p className="mt-5 text-pretty text-lg text-muted-foreground">
            Start free, then grow into predictive AI and an immutable ledger as your network
            expands. No hidden fees — every plan includes the full control tower.
          </p>
        </FadeIn>

        {/* Billing toggle */}
        <FadeIn delay={0.1} className="mt-10 flex flex-col items-center gap-3">
          <div
            role="tablist"
            aria-label="Billing period"
            className="inline-flex items-center gap-1 rounded-2xl bg-muted/60 p-1.5 shadow-clay-inset"
          >
            {(["monthly", "annual"] as const).map((value) => {
              const active = period === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(value)}
                  className={cn(
                    "relative rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-colors",
                    active
                      ? "bg-card text-foreground shadow-clay-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {value}
                  {value === "annual" && (
                    <Badge variant="success" className="ml-2 px-1.5 py-0 text-[10px]">
                      -20%
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {period === "annual"
              ? "Billed annually — two months free versus monthly."
              : "Billed monthly. Switch to annual to save 20%."}
          </p>
        </FadeIn>

        {/* Pricing cards */}
        <StaggerGroup className="mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <StaggerItem key={tier.id} className="h-full">
              <Card
                className={cn(
                  "relative flex h-full flex-col p-1",
                  tier.highlighted
                    ? "shadow-glow ring-1 ring-primary/40 lg:scale-[1.04]"
                    : "clay-interactive",
                )}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-clay-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Most popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="gap-2">
                  <h2 className="text-lg font-bold tracking-tight">{tier.name}</h2>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-bold tracking-tight">
                      {formatTierPrice(tier, period)}
                    </span>
                    {tier.monthly !== null && tier.monthly > 0 && (
                      <span className="pb-1.5 text-sm text-muted-foreground">
                        {period === "annual" ? "/mo, billed yearly" : "/mo"}
                      </span>
                    )}
                    {tier.monthly === 0 && (
                      <span className="pb-1.5 text-sm text-muted-foreground">forever</span>
                    )}
                  </div>
                  <p className="min-h-10 text-sm text-muted-foreground">{tier.tagline}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <Button
                    asChild
                    size="lg"
                    variant={tier.highlighted ? "gradient" : "clay"}
                    className="w-full"
                  >
                    <Link href={tier.cta.href}>
                      {tier.cta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <ul className="flex flex-1 flex-col gap-3">
                    {tier.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-success/15 text-success">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground/70">
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span
                          className={cn(
                            feature.included
                              ? "text-foreground"
                              : "text-muted-foreground/70",
                          )}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Feature comparison */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Compare
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Every plan, side by side
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            The complete breakdown of what ships with each tier of ChainRoute AI.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          <Card className="overflow-hidden p-2">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-52">Feature</TableHead>
                  {TIERS.map((tier) => (
                    <TableHead
                      key={tier.id}
                      className={cn(
                        "text-center text-sm font-semibold normal-case tracking-normal text-foreground",
                        tier.highlighted && "text-primary",
                      )}
                    >
                      {tier.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    {row.values.map((value, index) => (
                      <TableCell
                        key={index}
                        className={cn(
                          "text-center text-sm text-muted-foreground",
                          index === 1 && "bg-primary/[0.04]",
                        )}
                      >
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-28 max-w-3xl px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Billing FAQ
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Questions about pricing
          </h2>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10 space-y-3">
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <Card key={faq.q} variant="flat" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : index)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    open
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </FadeIn>
      </section>

      {/* Final CTA band */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <FadeIn>
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary p-10 text-center text-primary-foreground shadow-clay-lg sm:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="relative mx-auto max-w-2xl">
              <ShieldCheck className="mx-auto h-10 w-10 opacity-90" />
              <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to route smarter?
              </h2>
              <p className="mt-4 text-pretty text-base text-primary-foreground/85 sm:text-lg">
                Spin up your control tower in minutes on the free plan, or talk to our team about
                an enterprise rollout tailored to your network.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="clay" className="text-foreground">
                  <Link href="/signup">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                >
                  <Link href="/contact">Contact sales</Link>
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>
      </section>
    </div>
  );
}
